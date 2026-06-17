const canvas = document.getElementById('displayCanvas');

connectEvents();
loadState();

async function loadState() {
	try {
		const response = await fetch('/api/state', { cache: 'no-store' });
		render(await response.json());
	} catch {}
}

function connectEvents() {
	const events = new EventSource('/api/events');
	events.onmessage = event => render(JSON.parse(event.data));
	events.onerror = () => {};
}

function render(state) {
	const players = state.players || [];
	const activeIndex = Number(state.activePlayerIndex || 0);
	const status = state.status || 'waiting';

	if (!players.length || status === 'waiting') {
		canvas.innerHTML = buildIdleScreen();
		return;
	}

	const setsTarget = Number(state.setsTarget || 1);
	const winner = players.find(p => Number(p.setsWon || 0) >= setsTarget);

	if (status === 'matchWon' || winner) {
		canvas.innerHTML = buildMatchEndScreen(winner || players[activeIndex], state);
		return;
	}

	// legWon / setWon: briefly show the normal board (the app handles the transition)
	if (players.length === 1) {
		canvas.innerHTML = buildSinglePlayerScreen(players[0], status, state);
	} else if (players.length === 2) {
		canvas.innerHTML = buildTwoPlayerScreen(players, activeIndex, status, state);
	} else {
		canvas.innerHTML = buildMultiPlayerScreen(players, activeIndex, status, state);
	}
}

/* ── IDLE ── */
function buildIdleScreen() {
	return `
		<div class="idle-screen">
			<div class="idle-radar">
				<div class="radar-ring radar-ring--1"></div>
				<div class="radar-ring radar-ring--2"></div>
				<div class="radar-ring radar-ring--3"></div>
				<div class="idle-title">DART<span>SCORER</span></div>
			</div>
			<div class="idle-subtitle">Rozpocznij mecz z telefonu</div>
		</div>`;
}

/* ── DARTBOARD SVG ── */
function buildDartboardSVG() {
	const cx = 100, cy = 100, R = 80;
	const rDoubleI = 72, rTripleO = 51, rTripleI = 44, rOutBull = 9, rBull = 4.2;
	const sectors = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

	function toRad(d) { return (d - 90) * Math.PI / 180; }
	function px(r, d) { return (cx + r * Math.cos(toRad(d))).toFixed(2); }
	function py(r, d) { return (cy + r * Math.sin(toRad(d))).toFixed(2); }

	function arc(r1, r2, a1, a2) {
		return `M${px(r2,a1)},${py(r2,a1)} A${r2},${r2} 0 0,1 ${px(r2,a2)},${py(r2,a2)} L${px(r1,a2)},${py(r1,a2)} A${r1},${r1} 0 0,0 ${px(r1,a1)},${py(r1,a1)} Z`;
	}

	let g = '';
	g += `<circle cx="${cx}" cy="${cy}" r="${R+1}" fill="#1a1a1a"/>`;
	g += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#111"/>`;

	sectors.forEach((_, i) => {
		const a1 = i * 18 - 9, a2 = a1 + 18;
		const even = i % 2 === 0;
		const fc = even ? '#151515' : '#ede0ba';
		const sc = even ? '#c01a1a' : '#1a9c3e';
		g += `<path d="${arc(rDoubleI, R, a1, a2)}" fill="${sc}"/>`;
		g += `<path d="${arc(rTripleO, rDoubleI, a1, a2)}" fill="${fc}"/>`;
		g += `<path d="${arc(rTripleI, rTripleO, a1, a2)}" fill="${sc}"/>`;
		g += `<path d="${arc(rOutBull, rTripleI, a1, a2)}" fill="${fc}"/>`;
	});

	g += `<circle cx="${cx}" cy="${cy}" r="${rOutBull}" fill="#1a9c3e"/>`;
	g += `<circle cx="${cx}" cy="${cy}" r="${rBull}" fill="#c01a1a"/>`;

	sectors.forEach((_, i) => {
		const ar = toRad(i * 18 - 9);
		g += `<line x1="${(cx+rOutBull*Math.cos(ar)).toFixed(2)}" y1="${(cy+rOutBull*Math.sin(ar)).toFixed(2)}" x2="${(cx+R*Math.cos(ar)).toFixed(2)}" y2="${(cy+R*Math.sin(ar)).toFixed(2)}" stroke="#000" stroke-width="0.7"/>`;
	});

	[R, rDoubleI, rTripleO, rTripleI, rOutBull, rBull].forEach(r => {
		g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="0.8"/>`;
	});

	sectors.forEach((num, i) => {
		const ar = toRad(i * 18);
		const tx = (cx + 92 * Math.cos(ar)).toFixed(1);
		const ty = (cy + 92 * Math.sin(ar)).toFixed(1);
		g += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="8" font-family="Arial,sans-serif" font-weight="800" fill="#ddd">${num}</text>`;
	});

	return `<svg viewBox="-14 -14 228 228" xmlns="http://www.w3.org/2000/svg" class="me-dartboard-svg"><defs><clipPath id="meBoardClip"><circle cx="${cx}" cy="${cy}" r="0"><animate attributeName="r" from="0" to="96" dur="0.85s" begin="0.1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.9 0.4 1"/></circle></clipPath></defs><g clip-path="url(#meBoardClip)">${g}</g></svg>`;
}

/* ── DART SVG ── */
function buildDartSVG() {
	return `<svg class="me-dart-svg" viewBox="0 0 300 70" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="meDartBarrel" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%"   stop-color="#c0c0c0"/>
				<stop offset="25%"  stop-color="#f5f5f5"/>
				<stop offset="75%"  stop-color="#e0e0e0"/>
				<stop offset="100%" stop-color="#999"/>
			</linearGradient>
		</defs>
		<!-- Stalowy czubek - cienka igła -->
		<polygon points="0,35 20,32.5 20,37.5" fill="#aaa"/>
		<!-- Barrel - kształt torpedo -->
		<path d="M19,32 Q32,29 56,27.5 Q76,28 96,31.5 L96,38.5 Q76,42 56,42.5 Q32,41 19,38 Z" fill="url(#meDartBarrel)" stroke="rgba(150,150,150,0.4)" stroke-width="0.5"/>
		<!-- Rowkowanie (knurling) -->
		<line x1="33" y1="29.5" x2="33" y2="40.5" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="41" y1="28.8" x2="41" y2="41.2" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="49" y1="28.2" x2="49" y2="41.8" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="57" y1="27.8" x2="57" y2="42.2" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="65" y1="28"   x2="65" y2="42"   stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="73" y1="28.5" x2="73" y2="41.5" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="81" y1="29.5" x2="81" y2="40.5" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<line x1="89" y1="30.5" x2="89" y2="39.5" stroke="rgba(60,60,60,0.5)" stroke-width="1.2"/>
		<!-- Shaft - cienki drążek -->
		<rect x="95" y="33.5" width="60" height="3" rx="1.5" fill="#2a2a2a"/>
		<!-- Loty - kształt łzy (góra) -->
		<path d="M153,35 Q172,18 246,6 Q266,12 261,21 Q216,27 160,35 Z" fill="rgba(52,211,107,0.92)"/>
		<!-- Loty - kształt łzy (dół) -->
		<path d="M153,35 Q172,52 246,64 Q266,58 261,49 Q216,43 160,35 Z" fill="rgba(52,211,107,0.76)"/>
		<!-- Żyłki lotów -->
		<line x1="154" y1="35" x2="261" y2="15.5" stroke="rgba(255,255,255,0.18)" stroke-width="0.9"/>
		<line x1="154" y1="35" x2="261" y2="54.5" stroke="rgba(255,255,255,0.12)" stroke-width="0.9"/>
	</svg>`;
}

/* ── MATCH END ── */
function buildMatchEndScreen(winner, state) {
	const setsVal = `${winner.setsWon}/${state.setsTarget}`;
	const legsVal = `${winner.matchLegsWon ?? winner.legsWon}/${state.legsTarget}`;
	const avgVal  = fmtAvg(winner.matchAverage3d ?? winner.average3d);

	setTimeout(() => {
		const c = document.getElementById('meConfetti');
		if (c) startConfetti(c);
	}, 1800);

	return `
		<canvas class="me-confetti" id="meConfetti"></canvas>
		<div class="match-end-screen">
			<div class="me-board-wrap">
				<div class="me-dartboard">
					${buildDartboardSVG()}
					<div class="me-ripple"></div>
					<div class="me-dart-wrap">${buildDartSVG()}</div>
				</div>
			</div>
			<div class="me-winner-label">KONIEC MECZU</div>
			<div class="me-winner-name">${esc(winner.name)}</div>
			<div class="me-winner-sub">WYGRYWA MECZ!</div>
			<div class="me-stats">
				<div class="me-stat"><div class="me-stat-label">SETY</div><div class="me-stat-value">${setsVal}</div></div>
				<div class="me-stat"><div class="me-stat-label">LEGI</div><div class="me-stat-value">${legsVal}</div></div>
				<div class="me-stat"><div class="me-stat-label">ŚREDNIA</div><div class="me-stat-value">${avgVal}</div></div>
			</div>
		</div>`;
}

function startConfetti(canvas) {
	const ctx = canvas.getContext('2d');
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;

	const colors = ['#34d36b', '#34d36b', '#ffffff', '#8AB4F8', '#ffd700', '#ff6b6b'];
	const particles = Array.from({ length: 150 }, () => ({
		x:     Math.random() * canvas.width,
		y:     -20 - Math.random() * 350,
		w:     5  + Math.random() * 11,
		h:     3  + Math.random() * 7,
		color: colors[Math.floor(Math.random() * colors.length)],
		vx:    (Math.random() - .5) * 2.5,
		vy:    2.5 + Math.random() * 4,
		rot:   Math.random() * Math.PI * 2,
		vrot:  (Math.random() - .5) * .13,
	}));

	const start    = performance.now();
	const DURATION = 7000;
	const FADE_AT  = DURATION * .72;

	function frame(now) {
		const elapsed = now - start;
		if (elapsed >= DURATION) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }

		const alpha = elapsed > FADE_AT ? 1 - (elapsed - FADE_AT) / (DURATION - FADE_AT) : 1;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const p of particles) {
			p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
			if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.fillStyle = p.color;
			ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
			ctx.restore();
		}
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
}

/* ── TOP BAR ── */
function buildTopBar(state) {
	const setsTarget = Number(state.setsTarget || 1);
	const legsTarget = Number(state.legsTarget || 1);
	const modeLine = setsTarget > 1
		? `DO ${setsTarget} SETA · ${legsTarget} LEGI`
		: `DO ${legsTarget} LEGI`;
	return `
		<header class="top-bar">
			<div class="brand">
				<div class="brand-bar"></div>
				<div class="brand-name">DART<span>SCORER</span></div>
			</div>
			<div class="game-info">
				<span class="game-score">${state.startScore}</span>
				<div class="info-divider"></div>
				<span class="game-mode-label">DOUBLE OUT</span>
				<div class="info-divider"></div>
				<span class="game-mode-label">${esc(modeLine)}</span>
			</div>
			<div class="live-badge">
				<span class="live-dot"></span>
				<span class="live-text">LIVE</span>
			</div>
		</header>`;
}

/* ── CENTER PANEL ── */
function buildCenterPanel(state, players) {
	const setsTarget = Number(state.setsTarget || 1);
	const legsTarget = Number(state.legsTarget || 1);
	const p1 = players?.[0];
	const p2 = players?.[1];

	const legsRow = (p1 && p2) ? `
		<div class="msc-row">
			<span class="msc-val">${p1.legsWon}</span>
			<div class="msc-label-col">
				<span class="msc-label">LEGI</span>
				<span class="msc-sub">FT ${legsTarget}</span>
			</div>
			<span class="msc-val">${p2.legsWon}</span>
		</div>` : '';

	const setsRow = (setsTarget > 1 && p1 && p2) ? `
		<div class="msc-row">
			<span class="msc-val msc-val--dim">${p1.setsWon}</span>
			<div class="msc-label-col">
				<span class="msc-label">SETY</span>
				<span class="msc-sub">FT ${setsTarget}</span>
			</div>
			<span class="msc-val msc-val--dim">${p2.setsWon}</span>
		</div>` : '';

	return `
		<div class="center-panel">
			<div class="center-line"></div>
			<div class="match-score-center">
				${legsRow}
				${setsRow}
			</div>
		</div>`;
}

/* ── SCREENS ── */
function buildSinglePlayerScreen(player, status, state) {
	return `
		<div class="game-screen">
			${buildTopBar(state)}
			<div class="single-player-main">
				${buildPlayerPanel(player, true, status, 'left')}
			</div>
		</div>`;
}

function buildTwoPlayerScreen(players, activeIndex, status, state) {
	const bustPlayerId = state.bustPlayerId ?? null;
	return `
		<div class="game-screen">
			${buildTopBar(state)}
			<div class="game-main">
				${buildPlayerPanel(players[0], activeIndex === 0, status, 'left', bustPlayerId)}
				${buildCenterPanel(state, players)}
				${buildPlayerPanel(players[1], activeIndex === 1, status, 'right', bustPlayerId)}
			</div>
		</div>`;
}

function buildMultiPlayerScreen(players, activeIndex, status, state) {
	const bustPlayerId = state.bustPlayerId ?? null;
	const cards = players.slice(0, 4)
		.map((p, i) => buildCompactCard(p, i === activeIndex, status, bustPlayerId, state))
		.join('');
	return `
		<div class="game-screen">
			${buildTopBar(state)}
			<div class="multi-player-main">${cards}</div>
		</div>`;
}

/* ── PLAYER PANEL (2-player layout) ── */
function buildPlayerPanel(player, isActive, status, side, bustPlayerId) {
	const isBust  = status === 'bust' && bustPlayerId != null && player.id === bustPlayerId;
	const isRight = side === 'right';

	// checkout
	const checkoutArr = Array.isArray(player.checkout) ? player.checkout : [];
	const checkout    = checkoutArr.length ? checkoutArr.join(' · ') : null;

	// all turns this leg (busts stored as 0 in the array at their original position)
	const turns     = Array.isArray(player.turns) ? player.turns : [];

	// stats
	const count180 = turns.filter(t => t === 180).length;
	// legDarts: each turn = 3 darts (bust turns already included as 0 in array)
	const legDarts = turns.length * 3;
	const legAvg   = fmtAvg(player.legAverage3d ?? player.average3d);
	const setAvg   = fmtAvg(player.setAverage3d  ?? player.average3d);

	const statusLabel = isActive ? 'PRZY TARCZY' : 'CZEKA';

	// chips for ALL turns in the leg (most recent last)
	const chipsHtml = turns.length
		? turns.map(t => {
			const cls = t === 0    ? 'turn-chip turn-chip--bust'
				: t === 180  ? 'turn-chip turn-chip--180'
				: t >= 100   ? 'turn-chip turn-chip--high'
				: 'turn-chip';
			return `<span class="${cls}">${t}</span>`;
		}).join('')
		: '<span class="turn-chip">—</span>';

	// checkout bar
	const cbCls  = 'checkout-bar'  + (isActive && checkout ? ' checkout-bar--active'  : '');
	const cvCls  = 'checkout-value' + (isActive && checkout ? ' checkout-value--active' : '');
	const cvText = checkout ? esc(checkout) : 'BRAK';

	// arrow
	const arrowHtml = isActive
		? `<div class="active-arrow${isRight ? ' active-arrow--left' : ''}"></div>`
		: '';

	const nameHtml = `
		<div class="name-block${isRight ? ' name-block--right' : ''}">
			<div class="player-name">${esc(player.name)}</div>
			<div class="player-status-label${isActive ? ' player-status-label--active' : ''}">${statusLabel}</div>
		</div>`;

	// header layout: left panel → [name+arrow], right panel → [name+arrow]
	const headerHtml = isRight
		? `<div class="panel-header">
				<div class="panel-header-identity">${nameHtml}${arrowHtml}</div>
			</div>`
		: `<div class="panel-header">
				<div class="panel-header-identity">${arrowHtml}${nameHtml}</div>
			</div>`;

	// stat strip
	const sa = isActive ? ' stat-item--accent' : '';
	const sl = isActive ? ' stat-item-label--accent' : '';

	return `
		<div class="player-panel ${isActive ? 'player-panel--active' : 'player-panel--inactive'}">
			<div class="side-bar ${isRight ? 'side-bar--right' : 'side-bar--left'}"></div>

			${headerHtml}

			<div class="big-score-area">
				<div class="big-score${isBust ? ' big-score--bust' : ''}">${player.remaining}</div>
				<div class="${cbCls}">
					<span class="checkout-label">CHECKOUT</span>
					<span class="${cvCls}">${cvText}</span>
				</div>
			</div>

			<div class="last-visits-row">
				<span class="last-visits-label">LOTY</span>
				<div class="last-visits-chips">${chipsHtml}</div>
			</div>

			<div class="stat-strip">
				<div class="stat-item${sa}">
					<div class="stat-item-label${sl}">ŚREDNIA · 3 LOTKI</div>
					<div class="stat-item-value">${legAvg}</div>
				</div>
				<div class="stat-item">
					<div class="stat-item-label">ŚR. / LEG</div>
					<div class="stat-item-value">${setAvg}</div>
				</div>
				<div class="stat-item">
					<div class="stat-item-label">LOTKI W LEGU</div>
					<div class="stat-item-value">${legDarts > 0 ? legDarts : '—'}</div>
				</div>
				<div class="stat-item">
					<div class="stat-item-label">180-TKI</div>
					<div class="stat-item-value">${count180}</div>
				</div>
			</div>
		</div>`;
}

/* ── COMPACT CARD (3-4 players) ── */
function buildCompactCard(player, isActive, status, bustPlayerId, state) {
	const isBust   = status === 'bust' && bustPlayerId != null && player.id === bustPlayerId;
	const turns    = Array.isArray(player.turns) ? player.turns : [];
	const checkout = Array.isArray(player.checkout) && player.checkout.length
		? player.checkout.join(' · ') : 'BRAK';
	const legAvg   = fmtAvg(player.legAverage3d ?? player.average3d);

	const chipsHtml = turns.length
		? turns.map(t => {
			const cls = t === 0   ? 'turn-chip turn-chip--bust'
				: t === 180 ? 'turn-chip turn-chip--180'
				: t >= 100  ? 'turn-chip turn-chip--high'
				: 'turn-chip';
			return `<span class="${cls}">${t}</span>`;
		}).join('')
		: '<span class="turn-chip">—</span>';

	const arrowHtml = isActive ? '<div class="active-arrow"></div>' : '';

	return `
		<div class="compact-card${isActive ? ' compact-card--active' : ''}">
			<div class="compact-header">
				${arrowHtml}
				<div class="compact-name">${esc(player.name)}</div>
				<div class="compact-counters">
					<span class="counter-pill">S:${player.setsWon}/${state?.setsTarget ?? '?'}</span>
					<span class="counter-pill${isActive ? ' counter-pill--accent' : ''}">L:${player.legsWon}/${state?.legsTarget ?? '?'}</span>
				</div>
			</div>
			<div class="compact-score${isBust ? ' big-score--bust' : ''}">${player.remaining}</div>
			<div class="compact-checkout">${esc(checkout)}</div>
			<div class="compact-stats">
				<span class="compact-avg">Avg: ${legAvg}</span>
				<div class="last-visits-chips">${chipsHtml}</div>
			</div>
		</div>`;
}

/* ── HELPERS ── */
function fmtAvg(value) {
	return Number(value || 0).toFixed(1);
}

function esc(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}
