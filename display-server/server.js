const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const PLAYER_TTL_MS = 45000;
// Drop rooms that have seen no activity (no polls, no turns) for this long.
const ROOM_TTL_MS = 1000 * 60 * 60; // 1 hour
const ROOM_SWEEP_INTERVAL_MS = 1000 * 60 * 5; // every 5 minutes

let state = createInitialState();
const clients = new Set();
let requestCount = 0;

const rooms = new Map();
const roomClients = new Map();

const mimeTypes = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
};

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, `http://${req.headers.host}`);

		if (req.method === 'OPTIONS') {
			res.writeHead(204, {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			});
			res.end();
			return;
		}

		if (req.method === 'GET' && url.pathname === '/') {
			redirect(res, '/display');
			return;
		}

		if (req.method === 'GET' && url.pathname === '/display') {
			await serveFile(res, path.join(PUBLIC_DIR, 'display.html'));
			return;
		}

		if (req.method === 'GET' && url.pathname === '/api/state') {
			sendJson(res, state);
			return;
		}

		if (req.method === 'GET' && url.pathname === '/api/debug') {
			sendJson(res, {
				clients: clients.size,
				requestCount,
				state,
			});
			return;
		}

		if (req.method === 'POST' && url.pathname === '/api/state') {
			const payload = await readJson(req);
			state = normalizeState({ ...state, ...payload });
			requestCount += 1;
			console.log(`[display] state #${requestCount}: ${state.status}, ${state.players[0]?.name ?? '-'} ${state.players[0]?.remaining ?? '-'}`);
			broadcast(state);
			sendJson(res, state);
			return;
		}

		if (req.method === 'POST' && url.pathname === '/api/reset') {
			state = createInitialState();
			broadcast(state);
			sendJson(res, state);
			return;
		}

		if (req.method === 'GET' && url.pathname === '/api/events') {
			openEventStream(req, res);
			return;
		}

		// Room-based multiplayer routes
		const roomMatch = /^\/api\/rooms(?:\/([A-Z0-9]{4})(\/[a-z-]+)?)?$/i.exec(url.pathname);
		if (roomMatch) {
			const code = (roomMatch[1] || '').toUpperCase();
			const sub = roomMatch[2] || '';

			if (!code && req.method === 'POST') {
				const payload = await readJson(req);
				const room = createRoom(payload);
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && !sub && req.method === 'GET') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && sub === '/join' && req.method === 'POST') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				if (room.players.length >= 2) { sendJsonStatus(res, 400, { error: 'Room is full' }); return; }
				if (room.status !== 'waiting') { sendJsonStatus(res, 400, { error: 'Cannot join this room' }); return; }
				const payload = await readJson(req);
				room.players[0].seat = 0;
				const guest = createRoomPlayer(payload.id, payload.name, room.startScore);
				guest.seat = 1;
				room.players.push(guest);
				room.status = 'ready';
				broadcastRoom(room);
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && sub === '/start' && req.method === 'POST') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				if (room.status !== 'ready') { sendJsonStatus(res, 400, { error: 'Room not ready' }); return; }
				const payload = await readJson(req);
				if (room.players[0].id !== String(payload.playerId)) { sendJsonStatus(res, 403, { error: 'Only host can start' }); return; }
				const starterSeat = clamp(toNumber(payload.starterSeat ?? 0), 0, 1);
				room.legStarterIndex = starterSeat;
				room.activePlayerIndex = starterSeat;
				room.status = 'playing';
				broadcastRoom(room);
				broadcastRoomToDisplay(room);
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && sub === '/turn' && req.method === 'POST') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				const payload = await readJson(req);
				const result = processRoomTurn(room, String(payload.playerId), toNumber(payload.score));
				if (result.error) { sendJsonStatus(res, 400, result); return; }
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && sub === '/undo' && req.method === 'POST') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				const payload = await readJson(req);
				const result = undoRoomTurn(room, String(payload.playerId));
				if (result.error) { sendJsonStatus(res, 400, result); return; }
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && sub === '/display-confirm' && req.method === 'POST') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				// Unlock next leg: reset remaining and resume play so opponent's numpad activates
				if (room.status === 'legWon' || room.status === 'setWon') {
					room.players.forEach(p => { p.remaining = room.startScore; });
					room.status = 'playing';
					broadcastRoom(room);
				}
				broadcastRoomToDisplay(room);
				sendJson(res, serializeRoom(room));
				return;
			}
			if (code && sub === '/events' && req.method === 'GET') {
				const room = rooms.get(code);
				if (!room) { sendJsonStatus(res, 404, { error: 'Room not found' }); return; }
				openRoomEventStream(req, res, room);
				return;
			}
			sendText(res, 404, 'Not Found');
			return;
		}

		if (req.method === 'GET') {
			await serveFile(res, path.join(PUBLIC_DIR, cleanPublicPath(url.pathname)));
			return;
		}

		sendText(res, 405, 'Method Not Allowed');
	} catch (error) {
		console.error(error);
		sendText(res, 500, 'Internal Server Error');
	}
});

server.listen(PORT, HOST, () => {
	console.log(`Dart display server listening on http://localhost:${PORT}/display`);
	for (const address of getLocalAddresses()) {
		console.log(`Network display URL: http://${address}:${PORT}/display`);
	}
});

const roomSweepTimer = setInterval(sweepStaleRooms, ROOM_SWEEP_INTERVAL_MS);
roomSweepTimer.unref?.();

function sweepStaleRooms() {
	const now = Date.now();
	for (const [code, room] of rooms) {
		if (now - (room.lastActivity ?? room.createdAt ?? 0) < ROOM_TTL_MS) continue;
		const clients = roomClients.get(code);
		if (clients) {
			for (const client of clients) {
				clearInterval(client.heartbeat);
				try { client.res.end(); } catch {}
			}
		}
		roomClients.delete(code);
		rooms.delete(code);
		console.log(`[room] swept stale ${code} (inactive ${Math.round((now - (room.lastActivity ?? 0)) / 1000)}s)`);
	}
}

function createInitialState() {
	return {
		startScore: 501,
		players: [],
		activePlayerIndex: 0,
		setsTarget: 3,
		legsTarget: 5,
		currentSet: 1,
		currentLeg: 1,
		turnNumber: 1,
		status: 'waiting',
		message: 'Ekran czeka na start z telefonu',
		transition: {
			from: null,
			to: '',
			text: 'Czekam na graczy',
		},
		updatedAt: new Date().toISOString(),
	};
}

function normalizeState(next) {
	const startScore = clamp(toNumber(next.startScore), 1, 999);
	const incomingPlayers = normalizePlayers(next, startScore);
	const incomingActiveIndex = clamp(toNumber(next.activePlayerIndex), 0, Math.max(incomingPlayers.length - 1, 0));
	const incomingActiveId = incomingPlayers[incomingActiveIndex]?.id;
	const players = mergePlayers(state.players || [], incomingPlayers);
	const foundActiveIndex = players.findIndex(player => player.id === incomingActiveId);
	const activePlayerIndex = foundActiveIndex >= 0 ? foundActiveIndex : 0;
	const activePlayer = players[activePlayerIndex] || players[0] || createPlayer({ id: 'empty', name: '' });
	const previousState = state || createInitialState();
	const previousActive = previousState.players?.[previousState.activePlayerIndex];
	const transition = normalizeTransition(next.transition, previousActive, activePlayer);

	return {
		startScore,
		players,
		activePlayerIndex,
		setsTarget: clamp(toNumber(next.setsTarget), 1, 99),
		legsTarget: clamp(toNumber(next.legsTarget), 1, 99),
		currentSet: clamp(toNumber(next.currentSet), 1, 99),
		currentLeg: clamp(toNumber(next.currentLeg), 1, 99),
		turnNumber: clamp(toNumber(next.turnNumber), 1, 999),
		status: players.length === 0 ? 'waiting' : ['waiting', 'playing', 'transition', 'bust', 'legWon', 'setWon', 'matchWon'].includes(next.status) ? next.status : 'playing',
		message: String(next.message || '').slice(0, 90),
		transition,
		updatedAt: new Date().toISOString(),
	};
}

function createPlayer({
	id,
	name,
	remaining = 501,
	turns = [],
	setsWon = 0,
	legsWon = 0,
	matchLegsWon = null,
	checkout = [],
	lastTurn = null,
	average3d = null,
	legAverage3d = null,
	setAverage3d = null,
	matchAverage3d = null,
	legAverages3d = [],
	setAverages3d = [],
	legAverageHistory = [],
	setAverageHistory = [],
}) {
	const normalizedTurns = turns.map(toNumber).filter(Number.isFinite);
	const scored = normalizedTurns.reduce((sum, turn) => sum + turn, 0);
	const darts = normalizedTurns.length * 3;
	const fallbackAverage = Number(((scored / Math.max(darts, 1)) * 3).toFixed(1));

	return {
		id,
		name: String(name || 'Gracz').slice(0, 32),
		remaining: clamp(toNumber(remaining), 0, 999),
		setsWon: clamp(toNumber(setsWon), 0, 99),
		legsWon: clamp(toNumber(legsWon), 0, 99),
		matchLegsWon: matchLegsWon == null ? clamp(toNumber(legsWon), 0, 99) : clamp(toNumber(matchLegsWon), 0, 999),
		checkout: Array.isArray(checkout) ? checkout.map(String).slice(0, 3) : toCheckoutArray(checkout),
		lastTurn: lastTurn == null ? null : clamp(toNumber(lastTurn), 0, 180),
		average3d: average3d == null ? fallbackAverage : Number(toNumber(average3d).toFixed(1)),
		legAverage3d: legAverage3d == null ? fallbackAverage : Number(toNumber(legAverage3d).toFixed(1)),
		setAverage3d: setAverage3d == null ? fallbackAverage : Number(toNumber(setAverage3d).toFixed(1)),
		matchAverage3d: matchAverage3d == null ? fallbackAverage : Number(toNumber(matchAverage3d).toFixed(1)),
		legAverages3d: normalizeAverageList(legAverages3d),
		setAverages3d: normalizeAverageList(setAverages3d),
		legAverageHistory: normalizeAverageHistory(legAverageHistory, legAverages3d, 'L'),
		setAverageHistory: normalizeAverageHistory(setAverageHistory, setAverages3d, 'S'),
		turns: normalizedTurns,
	};
}

function normalizePlayers(next, startScore) {
	if (Array.isArray(next.players) && next.players.length > 0) {
		return next.players.slice(0, 4).map((player, index) =>
			createPlayer({
				id: String(player.id || `p${index + 1}`),
				name: player.name || `Gracz ${index + 1}`,
				remaining: player.remaining ?? startScore,
				turns: Array.isArray(player.turns) ? player.turns : [],
				setsWon: player.setsWon,
				legsWon: player.legsWon,
				matchLegsWon: player.matchLegsWon,
				checkout: player.checkout,
				lastTurn: player.lastTurn,
				average3d: player.average3d,
				legAverage3d: player.legAverage3d,
				setAverage3d: player.setAverage3d,
				matchAverage3d: player.matchAverage3d,
				legAverages3d: player.legAverages3d,
				setAverages3d: player.setAverages3d,
				legAverageHistory: player.legAverageHistory,
				setAverageHistory: player.setAverageHistory,
			})
		);
	}

	return [
		createPlayer({
			id: 'p1',
			name: next.playerName || 'Gracz 1',
			remaining: next.remaining ?? startScore,
			turns: Array.isArray(next.turns) ? next.turns : [],
			setsWon: next.setsWon,
			legsWon: next.legsWon,
			checkout: next.checkout,
			lastTurn: next.lastTurn,
			average3d: next.average3d,
		}),
	];
}

function normalizeAverageList(value) {
	if (!Array.isArray(value)) return [];
	return value.map(toNumber).filter(Number.isFinite).map(number => Number(number.toFixed(1))).slice(-12);
}

function normalizeAverageHistory(value, fallbackValues, fallbackPrefix) {
	if (Array.isArray(value) && value.length > 0) {
		return value
			.map((item, index) => ({
				label: String(item?.label || `${fallbackPrefix}${index + 1}`).slice(0, 12),
				value: Number(toNumber(item?.value).toFixed(1)),
				darts: item?.darts == null ? null : clamp(toNumber(item.darts), 0, 999),
			}))
			.filter(item => Number.isFinite(item.value))
			.slice(-12);
	}

	return normalizeAverageList(fallbackValues).map((average, index) => ({
		label: `${fallbackPrefix}${index + 1}`,
		value: average,
	}));
}

function mergePlayers(existingPlayers, incomingPlayers) {
	const now = Date.now();
	const activeExistingPlayers = existingPlayers.filter(player => {
		const updatedAt = Date.parse(player.updatedAt || '');
		return Number.isFinite(updatedAt) && now - updatedAt < PLAYER_TTL_MS;
	});
	const byId = new Map(activeExistingPlayers.map(player => [player.id, player]));
	for (const player of incomingPlayers) {
		byId.set(player.id, {
			...(byId.get(player.id) || {}),
			...player,
			updatedAt: new Date().toISOString(),
		});
	}

	return dedupePlayersByName([...byId.values()]);
}

function dedupePlayersByName(players) {
	const byName = new Map();
	for (const player of players) {
		const key = normalizeNameKey(player.name);
		const existing = byName.get(key);
		const existingTime = Date.parse(existing?.updatedAt || '');
		const playerTime = Date.parse(player.updatedAt || '');
		if (!existing || playerTime >= existingTime) {
			byName.set(key, player);
		}
	}
	return [...byName.values()];
}

function normalizeNameKey(name) {
	return String(name || '').trim().toLocaleLowerCase('pl') || 'gracz';
}

function normalizeTransition(input, previousActive, activePlayer) {
	if (input && typeof input === 'object') {
		const from = input.from == null ? null : String(input.from).slice(0, 32);
		const to = input.to == null ? activePlayer.name : String(input.to).slice(0, 32);
		return {
			from,
			to,
			text: String(input.text || createTransitionText(from, to)).slice(0, 90),
		};
	}

	const from = previousActive && previousActive.name !== activePlayer.name ? previousActive.name : null;
	return {
		from,
		to: activePlayer.name,
		text: createTransitionText(from, activePlayer.name),
	};
}

function createTransitionText(from, to) {
	return from ? `${from} -> ${to}` : `${to} przy tarczy`;
}

function toCheckoutArray(value) {
	if (!value) return [];
	return String(value)
		.split(/[,\s]+/)
		.map(part => part.trim())
		.filter(Boolean)
		.slice(0, 3);
}

function toNumber(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

async function readJson(req) {
	let body = '';
	for await (const chunk of req) {
		body += chunk;
		if (body.length > 1024 * 1024) throw new Error('Request body too large');
	}
	return body ? JSON.parse(body) : {};
}

function openEventStream(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		Connection: 'keep-alive',
		'Access-Control-Allow-Origin': '*',
		'X-Accel-Buffering': 'no',
	});
	req.socket.setKeepAlive(true);
	res.write(`data: ${JSON.stringify(state)}\n\n`);
	const client = {
		res,
		heartbeat: setInterval(() => {
			res.write(`: ping ${Date.now()}\n\n`);
		}, 15000),
	};
	clients.add(client);
	console.log(`[display] browser connected, clients=${clients.size}`);
	req.on('close', () => {
		clearInterval(client.heartbeat);
		clients.delete(client);
		console.log(`[display] browser disconnected, clients=${clients.size}`);
	});
}

function broadcast(payload) {
	const data = `data: ${JSON.stringify(payload)}\n\n`;
	for (const client of clients) {
		client.res.write(data);
	}
}

async function serveFile(res, filePath) {
	const normalized = path.normalize(filePath);
	if (!normalized.startsWith(PUBLIC_DIR)) {
		sendText(res, 403, 'Forbidden');
		return;
	}

	try {
		const content = await fs.readFile(normalized);
		const ext = path.extname(normalized);
		res.writeHead(200, {
			'Content-Type': mimeTypes[ext] || 'application/octet-stream',
			'Cache-Control': 'no-cache',
		});
		res.end(content);
	} catch (error) {
		if (error.code === 'ENOENT') {
			sendText(res, 404, 'Not Found');
			return;
		}
		throw error;
	}
}

function cleanPublicPath(urlPath) {
	return urlPath.replace(/^\/+/, '').replace(/\.\.+/g, '');
}

function redirect(res, location) {
	res.writeHead(302, { Location: location });
	res.end();
}

function sendJson(res, payload) {
	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	});
	res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
	res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end(text);
}

function getLocalAddresses() {
	return Object.values(os.networkInterfaces())
		.flat()
		.filter(address => address && address.family === 'IPv4' && !address.internal)
		.map(address => address.address);
}

// ── ROOM MANAGEMENT ──────────────────────────────────────────────────────────

function generateRoomCode() {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code;
	let attempts = 0;
	do {
		code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
		attempts++;
	} while (rooms.has(code) && attempts < 100);
	return code;
}

function createRoom({ startScore, setsTarget, legsTarget, hostId, hostName }) {
	const code = generateRoomCode();
	const host = createRoomPlayer(hostId, hostName, toNumber(startScore) || 501);
	host.seat = 0;
	const room = {
		code,
		status: 'waiting',
		startScore: clamp(toNumber(startScore || 501), 1, 999),
		setsTarget: clamp(toNumber(setsTarget || 1), 1, 9),
		legsTarget: clamp(toNumber(legsTarget || 1), 1, 9),
		currentSet: 1,
		currentLeg: 1,
		turnNumber: 1,
		activePlayerIndex: 0,
		legStarterIndex: 0,
		players: [host],
		undoStack: [],
		createdAt: Date.now(),
		lastActivity: Date.now(),
	};
	rooms.set(code, room);
	roomClients.set(code, new Set());
	console.log(`[room] created ${code} host=${hostName} ${room.startScore} ${room.setsTarget}x${room.legsTarget}`);
	return room;
}

function createRoomPlayer(id, name, remaining) {
	return {
		id: String(id || `p-${Date.now()}`).slice(0, 64),
		name: String(name || 'Gracz').slice(0, 32),
		seat: null,
		remaining: clamp(toNumber(remaining), 1, 999),
		setsWon: 0,
		legsWon: 0,
		matchLegsWon: 0,
		turns: [],
		legBusts: 0,
		setScored: 0,
		setDarts: 0,
		matchScored: 0,
		matchDarts: 0,
		legAverages: [],
		setAverages: [],
	};
}

function serializeRoom(room) {
	// Touch on every (de)serialization — covers polls, turns, joins, broadcasts.
	room.lastActivity = Date.now();
	return {
		code: room.code,
		status: room.status,
		startScore: room.startScore,
		setsTarget: room.setsTarget,
		legsTarget: room.legsTarget,
		currentSet: room.currentSet,
		currentLeg: room.currentLeg,
		turnNumber: room.turnNumber,
		activePlayerIndex: room.activePlayerIndex,
		players: room.players.map(serializeRoomPlayer),
		canUndo: room.undoStack.length > 0,
	};
}

function serializeRoomPlayer(p) {
	const legBusts = p.legBusts ?? 0;
	const legScored = p.turns.reduce((s, t) => s + t, 0);
	// Busts stored as 0 in turns array, so length already includes them (PDC rules: 3 darts per turn)
	const legDarts = p.turns.length * 3;
	const legAvg = legDarts > 0 ? +((legScored / legDarts) * 3).toFixed(1) : null;
	const setTotalScored = p.setScored + legScored;
	// p.setDarts and p.matchDarts already include bust darts from completed legs
	const setTotalDarts = p.setDarts + legDarts;
	const matchTotalScored = p.matchScored + legScored;
	const matchTotalDarts = p.matchDarts + legDarts;
	return {
		id: p.id,
		name: p.name,
		seat: p.seat,
		remaining: p.remaining,
		setsWon: p.setsWon,
		legsWon: p.legsWon,
		matchLegsWon: p.matchLegsWon,
		turns: p.turns,
		legBusts,
		legAverage3d: legAvg,
		setAverage3d: setTotalDarts > 0 ? +((setTotalScored / setTotalDarts) * 3).toFixed(1) : null,
		matchAverage3d: matchTotalDarts > 0 ? +((matchTotalScored / matchTotalDarts) * 3).toFixed(1) : null,
		average3d: matchTotalDarts > 0 ? +((matchTotalScored / matchTotalDarts) * 3).toFixed(1) : null,
		legAverages: p.legAverages,
		setAverages: p.setAverages,
	};
}

function processRoomTurn(room, playerId, score) {
	if (room.status === 'matchWon') return { error: 'Match is over' };
	if (!['playing', 'bust'].includes(room.status)) return { error: 'Game not started' };

	const seat = room.players.findIndex(p => p.id === playerId);
	if (seat === -1) return { error: 'Player not in room' };
	if (seat !== room.activePlayerIndex) return { error: 'Not your turn' };
	if (!Number.isFinite(score) || score < 0 || score > 180) return { error: 'Invalid score' };

	saveUndoState(room);

	const player = room.players[seat];
	const newRemaining = player.remaining - score;
	const isBust = newRemaining < 0 || newRemaining === 1;

	if (isBust) {
		player.legBusts = (player.legBusts ?? 0) + 1;
		player.turns = [...player.turns, 0];
		room.status = 'bust';
		room.activePlayerIndex = 1 - seat;
		room.turnNumber++;
		broadcastRoom(room);
		broadcastRoomToDisplay(room);
		return {};
	}

	player.turns = [...player.turns, score];
	player.remaining = newRemaining;

	if (newRemaining === 0) {
		const legScored = player.turns.reduce((s, t) => s + t, 0);
		const legDarts = player.turns.length * 3;
		if (legDarts > 0) {
			player.legAverages.push(+((legScored / legDarts) * 3).toFixed(1));
			player.setScored += legScored;
			player.setDarts += legDarts;
			player.matchScored += legScored;
			player.matchDarts += legDarts;
		}
		player.legsWon++;
		player.matchLegsWon++;

		const setWon = player.legsWon >= room.legsTarget;
		if (setWon) {
			if (player.setDarts > 0) {
				player.setAverages.push(+((player.setScored / player.setDarts) * 3).toFixed(1));
			}
			player.legsWon = 0;
			player.setScored = 0;
			player.setDarts = 0;
			player.setsWon++;

			if (player.setsWon >= room.setsTarget) {
				room.status = 'matchWon';
				room.players.forEach(p => {
					if (p.id !== player.id) {
						const lostScored = p.turns.reduce((s, t) => s + t, 0);
						const lostDarts = p.turns.length * 3;
						if (lostDarts > 0) {
							p.legAverages.push(+((lostScored / lostDarts) * 3).toFixed(1));
							p.setScored += lostScored;
							p.setDarts += lostDarts;
							p.matchScored += lostScored;
							p.matchDarts += lostDarts;
						}
					}
				});
				room.players.forEach(p => { p.turns = []; p.legBusts = 0; });
				broadcastRoom(room);
				broadcastRoomToDisplay(room);
				return {};
			}
			room.status = 'setWon';
			room.currentSet++;
			room.currentLeg = 1;
		} else {
			room.status = 'legWon';
			room.currentLeg++;
		}

		room.players.forEach(p => {
			if (p.id !== player.id) {
				const lostScored = p.turns.reduce((s, t) => s + t, 0);
				const lostDarts = p.turns.length * 3;
				if (lostDarts > 0) {
					p.legAverages.push(+((lostScored / lostDarts) * 3).toFixed(1));
					p.setScored += lostScored;
					p.setDarts += lostDarts;
					p.matchScored += lostScored;
					p.matchDarts += lostDarts;
				}
			}
		});
		room.players.forEach(p => { p.turns = []; p.legBusts = 0; });
		room.legStarterIndex = 1 - room.legStarterIndex;
		room.activePlayerIndex = room.legStarterIndex;
	} else {
		room.status = 'playing';
		room.activePlayerIndex = 1 - seat;
		room.turnNumber++;
	}

	broadcastRoom(room);
	broadcastRoomToDisplay(room);
	return {};
}

function saveUndoState(room) {
	room.undoStack.push({
		status: room.status,
		currentSet: room.currentSet,
		currentLeg: room.currentLeg,
		turnNumber: room.turnNumber,
		activePlayerIndex: room.activePlayerIndex,
		players: room.players.map(p => ({
			...p,
			turns: [...p.turns],
			legAverages: [...p.legAverages],
			setAverages: [...p.setAverages],
			legBusts: p.legBusts ?? 0,
		})),
	});
	if (room.undoStack.length > 5) room.undoStack.shift();
}

function undoRoomTurn(room, playerId) {
	if (room.undoStack.length === 0) return { error: 'Nothing to undo' };
	const snapshot = room.undoStack.pop();
	room.status = snapshot.status;
	room.currentSet = snapshot.currentSet;
	room.currentLeg = snapshot.currentLeg;
	room.turnNumber = snapshot.turnNumber;
	room.activePlayerIndex = snapshot.activePlayerIndex;
	room.players = snapshot.players;
	broadcastRoom(room);
	broadcastRoomToDisplay(room);
	return {};
}

function broadcastRoom(room) {
	const data = `data: ${JSON.stringify(serializeRoom(room))}\n\n`;
	const clients = roomClients.get(room.code);
	if (!clients) return;
	for (const client of clients) {
		try { client.res.write(data); } catch {}
	}
}

function broadcastRoomToDisplay(room) {
	const players = room.players.map(p => {
		const sp = serializeRoomPlayer(p);
		return {
			id: p.id,
			name: p.name,
			remaining: p.remaining,
			setsWon: p.setsWon,
			legsWon: p.legsWon,
			matchLegsWon: p.matchLegsWon,
			turns: p.turns,
			checkout: getRoomCheckout(p.remaining),
			average3d: sp.average3d ?? 0,
			legAverage3d: sp.legAverage3d ?? 0,
			setAverage3d: sp.setAverage3d ?? 0,
			matchAverage3d: sp.matchAverage3d ?? 0,
		};
	});
	const displayStatus = (room.status === 'waiting' || room.status === 'ready') ? 'waiting' : room.status;

	// After a bust, activePlayerIndex has already switched to the OTHER player.
	// So the busting player is at index (1 - activePlayerIndex).
	const bustPlayerId = room.status === 'bust'
		? (room.players[1 - room.activePlayerIndex]?.id ?? null)
		: null;

	state = normalizeState({
		startScore: room.startScore,
		players,
		activePlayerIndex: room.activePlayerIndex,
		setsTarget: room.setsTarget,
		legsTarget: room.legsTarget,
		currentSet: room.currentSet,
		currentLeg: room.currentLeg,
		turnNumber: room.turnNumber,
		status: displayStatus,
		message: '',
		transition: null,
	});
	state = { ...state, bustPlayerId };
	broadcast(state);
}

function openRoomEventStream(req, res, room) {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		'Connection': 'keep-alive',
		'Access-Control-Allow-Origin': '*',
		'X-Accel-Buffering': 'no',
	});
	req.socket.setKeepAlive(true);
	res.write(`data: ${JSON.stringify(serializeRoom(room))}\n\n`);
	const client = {
		res,
		heartbeat: setInterval(() => {
			try { res.write(`: ping ${Date.now()}\n\n`); } catch {}
		}, 15000),
	};
	const clients = roomClients.get(room.code);
	if (clients) clients.add(client);
	console.log(`[room] ${room.code} phone connected (${clients?.size})`);
	req.on('close', () => {
		clearInterval(client.heartbeat);
		if (clients) clients.delete(client);
		console.log(`[room] ${room.code} phone disconnected (${clients?.size})`);
	});
}

// Checkout hint chart (mirrors lib/checkout.ts)
const CHECKOUT_CHART = new Map([
	[170,['T20','T20','Bull']],[167,['T20','T19','Bull']],[164,['T20','T18','Bull']],[161,['T20','T17','Bull']],
	[160,['T20','T20','D20']],[158,['T20','T20','D19']],[157,['T20','T19','D20']],[156,['T20','T20','D18']],
	[155,['T20','T19','D19']],[154,['T20','T18','D20']],[153,['T20','T19','D18']],[152,['T20','T20','D16']],
	[151,['T20','T17','D20']],[150,['T20','T18','D18']],[149,['T20','T19','D16']],[148,['T20','T16','D20']],
	[147,['T20','T17','D18']],[146,['T20','T18','D16']],[145,['T20','T15','D20']],[144,['T20','T20','D12']],
	[143,['T20','T17','D16']],[142,['T20','T14','D20']],[141,['T20','T15','D18']],[140,['T20','T20','D10']],
	[139,['T20','T13','D20']],[138,['T20','T18','D12']],[137,['T20','T19','D10']],[136,['T20','T20','D8']],
	[135,['T20','T17','D12']],[134,['T20','T14','D16']],[133,['T20','T19','D8']],[132,['T20','T16','D12']],
	[131,['T20','T13','D16']],[130,['T20','T18','D8']],[129,['T19','T16','D12']],[128,['T18','T14','D16']],
	[127,['T20','T17','D8']],[126,['T19','T19','D6']],[125,['25','T20','D20']],[124,['T20','T16','D8']],
	[123,['T19','T16','D9']],[122,['T18','T18','D7']],[121,['T20','T11','D14']],[120,['T20','20','D20']],
	[119,['T19','T10','D16']],[118,['T20','18','D20']],[117,['T20','17','D20']],[116,['T20','16','D20']],
	[115,['T20','15','D20']],[114,['T20','14','D20']],[113,['T20','13','D20']],[112,['T20','12','D20']],
	[111,['T20','11','D20']],[110,['T20','10','D20']],[109,['T20','9','D20']],[108,['T20','8','D20']],
	[107,['T19','10','D20']],[106,['T20','6','D20']],[105,['T19','8','D20']],[104,['T18','18','D16']],
	[103,['T20','3','D20']],[102,['T20','10','D16']],[101,['T17','18','D16']],[100,['T20','D20']],
	[99,['T19','10','D16']],[98,['T20','D19']],[97,['T19','D20']],[96,['T20','D18']],[95,['T19','D19']],
	[94,['T18','D20']],[93,['T19','D18']],[92,['T20','D16']],[91,['T17','D20']],[90,['T18','D18']],
	[89,['T19','D16']],[88,['T16','D20']],[87,['T17','D18']],[86,['T18','D16']],[85,['T15','D20']],
	[84,['T20','D12']],[83,['T17','D16']],[82,['T14','D20']],[81,['T19','D12']],[80,['T20','D10']],
	[79,['T13','D20']],[78,['T18','D12']],[77,['T19','D10']],[76,['T20','D8']],[75,['T17','D12']],
	[74,['T14','D16']],[73,['T19','D8']],[72,['T16','D12']],[71,['T13','D16']],[70,['T18','D8']],
	[69,['T19','D6']],[68,['T20','D4']],[67,['T17','D8']],[66,['T10','D18']],[65,['25','D20']],
	[64,['T16','D8']],[63,['T13','D12']],[62,['T10','D16']],[61,['25','D18']],[60,['20','D20']],
	[59,['19','D20']],[58,['18','D20']],[57,['17','D20']],[56,['16','D20']],[55,['15','D20']],
	[54,['14','D20']],[53,['13','D20']],[52,['12','D20']],[51,['11','D20']],[50,['Bull']],
	[49,['17','D16']],[48,['16','D16']],[47,['15','D16']],[46,['14','D16']],[45,['13','D16']],
	[44,['12','D16']],[43,['11','D16']],[42,['10','D16']],[41,['9','D16']],[40,['D20']],
	[39,['7','D16']],[38,['D19']],[37,['5','D16']],[36,['D18']],[35,['3','D16']],[34,['D17']],
	[33,['3','D15']],[32,['D16']],[31,['15','D8']],[30,['D15']],[29,['13','D8']],[28,['D14']],
	[27,['11','D8']],[26,['D13']],[25,['9','D8']],[24,['D12']],[23,['7','D8']],[22,['D11']],
	[21,['5','D8']],[20,['D10']],[19,['3','D8']],[18,['D9']],[17,['1','D8']],[16,['D8']],
	[15,['7','D4']],[14,['D7']],[13,['5','D4']],[12,['D6']],[11,['3','D4']],[10,['D5']],
	[9,['1','D4']],[8,['D4']],[7,['3','D2']],[6,['D3']],[5,['1','D2']],[4,['D2']],
	[3,['1','D1']],[2,['D1']],
]);

function getRoomCheckout(remaining) {
	if (remaining < 2 || remaining > 170) return [];
	return CHECKOUT_CHART.get(remaining) ?? [];
}

function sendJsonStatus(res, statusCode, payload) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	});
	res.end(JSON.stringify(payload));
}
