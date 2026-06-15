import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameVariant, STARTING_SCORE } from '../lib/gameVariant';
import { useLanguage } from '../lib/LanguageContext';
import { getDisplayClientId, getDisplayPlayerName, getDisplayServerUrls } from '../lib/settings';
import { RootStackParamList } from '../navigation/types';

type Props = {
	navigation: {
		navigate: (screen: keyof RootStackParamList, params?: any) => void;
		goBack: () => void;
	};
};

function normalizeUrl(url: string) {
	return url.trim().replace(/\/+$/, '').replace(/\/display$/, '').replace(/\/api.*$/, '');
}

export default function MultiplayerScreen({ navigation }: Props) {
	const { strings } = useLanguage();
	const [tab, setTab] = useState<'create' | 'join'>('create');
	const [playerName, setPlayerName] = useState('');
	const [variant, setVariant] = useState<GameVariant>('501');
	const [legs, setLegs] = useState(1);
	const [sets, setSets] = useState(1);
	const [joinCode, setJoinCode] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		getDisplayPlayerName().then(setPlayerName);
	}, []);

	const handleCreate = async () => {
		if (!playerName.trim()) {
			Alert.alert(strings.error, strings.mpEnterName);
			return;
		}
		setLoading(true);
		try {
			const urls = await getDisplayServerUrls();
			const playerId = await getDisplayClientId();
			let serverUrl: string | null = null;
			let room: any = null;

			for (const url of urls) {
				try {
					const r = await fetch(`${normalizeUrl(url)}/api/rooms`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							startScore: STARTING_SCORE[variant],
							setsTarget: sets,
							legsTarget: legs,
							hostId: playerId,
							hostName: playerName.trim(),
						}),
					});
					if (r.ok) {
						serverUrl = normalizeUrl(url);
						room = await r.json();
						break;
					}
				} catch {}
			}

			if (!serverUrl || !room) {
				Alert.alert(strings.mpServerError, strings.mpServerErrorMsg);
				return;
			}

			navigation.navigate('RoomLobby', { roomCode: room.code, playerId, playerName: playerName.trim(), serverUrl });
		} finally {
			setLoading(false);
		}
	};

	const handleJoin = async () => {
		const code = joinCode.trim().toUpperCase();
		if (!playerName.trim()) {
			Alert.alert(strings.error, strings.mpEnterName);
			return;
		}
		if (code.length !== 4) {
			Alert.alert(strings.error, strings.mpRoomCodeLength);
			return;
		}
		setLoading(true);
		try {
			const urls = await getDisplayServerUrls();
			const playerId = await getDisplayClientId();
			let serverUrl: string | null = null;
			let room: any = null;

			for (const url of urls) {
				try {
					const r = await fetch(`${normalizeUrl(url)}/api/rooms/${code}/join`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id: playerId, name: playerName.trim() }),
					});
					if (r.ok) {
						serverUrl = normalizeUrl(url);
						room = await r.json();
						break;
					} else if (r.status === 400 || r.status === 404) {
						const err = await r.json().catch(() => ({}));
						Alert.alert(strings.error, err.error || strings.mpJoinError);
						return;
					}
				} catch {}
			}

			if (!serverUrl || !room) {
				Alert.alert(strings.mpServerError, strings.mpServerErrorMsg);
				return;
			}

			const mySeat = room.players.findIndex((p: any) => p.id === playerId);
			navigation.navigate('RoomGame', {
				roomCode: code,
				playerId,
				playerName: playerName.trim(),
				serverUrl,
				seat: mySeat >= 0 ? mySeat : 1,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
					<MaterialIcons name='arrow-back' size={22} color='#8AB4F8' />
				</Pressable>
				<View>
					<Text style={styles.eyebrow}>{strings.mpWifiSameNetwork}</Text>
					<Text style={styles.title}>Multiplayer</Text>
				</View>
			</View>

			<View style={styles.tabRow}>
				<Pressable style={[styles.tab, tab === 'create' && styles.tabActive]} onPress={() => setTab('create')}>
					<MaterialIcons name='add-circle-outline' size={15} color={tab === 'create' ? '#101113' : '#8AB4F8'} />
					<Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>{strings.mpCreateRoom}</Text>
				</Pressable>
				<Pressable style={[styles.tab, tab === 'join' && styles.tabActive]} onPress={() => setTab('join')}>
					<MaterialIcons name='login' size={15} color={tab === 'join' ? '#101113' : '#8AB4F8'} />
					<Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>{strings.mpJoinRoom}</Text>
				</Pressable>
			</View>

			<View style={styles.field}>
				<Text style={styles.label}>{strings.mpYourName}</Text>
				<TextInput
					style={styles.input}
					value={playerName}
					onChangeText={setPlayerName}
					placeholder={strings.mpNamePlaceholder}
					placeholderTextColor='#555'
					maxLength={24}
					autoCorrect={false}
				/>
			</View>

			{tab === 'create' ? (
				<>
					<View style={styles.field}>
						<Text style={styles.label}>{strings.mpVariant}</Text>
						<View style={styles.variantRow}>
							{(['501', '401', '301'] as GameVariant[]).map(v => (
								<Pressable key={v} style={[styles.variantBtn, variant === v && styles.variantBtnActive]} onPress={() => setVariant(v)}>
									<Text style={[styles.variantBtnText, variant === v && styles.variantBtnTextActive]}>{v}</Text>
								</Pressable>
							))}
						</View>
					</View>

					<View style={styles.countersRow}>
						<CounterCard label={strings.mpLegs} value={legs} min={1} max={9} onChange={setLegs} />
						<CounterCard label={strings.mpSets} value={sets} min={1} max={9} onChange={setSets} />
					</View>

					<Pressable style={[styles.actionBtn, loading && styles.actionBtnDisabled]} onPress={handleCreate} disabled={loading}>
						<MaterialIcons name='wifi-tethering' size={22} color='#101113' />
						<Text style={styles.actionBtnText}>{loading ? strings.mpCreating : strings.mpCreateRoom}</Text>
					</Pressable>
				</>
			) : (
				<>
					<View style={styles.field}>
						<Text style={styles.label}>{strings.mpRoomCode}</Text>
						<TextInput
							style={[styles.input, styles.codeInput]}
							value={joinCode}
							onChangeText={t => setJoinCode(t.toUpperCase().slice(0, 4))}
							placeholder='XXXX'
							placeholderTextColor='#555'
							maxLength={4}
							autoCapitalize='characters'
							autoCorrect={false}
						/>
					</View>

					<Pressable style={[styles.actionBtn, loading && styles.actionBtnDisabled]} onPress={handleJoin} disabled={loading}>
						<MaterialIcons name='login' size={22} color='#101113' />
						<Text style={styles.actionBtnText}>{loading ? strings.mpJoining : strings.mpJoinRoom}</Text>
					</Pressable>
				</>
			)}
		</SafeAreaView>
	);
}

function CounterCard({ label, value, min, max, onChange }: {
	label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
	return (
		<View style={styles.counterCard}>
			<Text style={styles.counterLabel}>{label}</Text>
			<View style={styles.counterControls}>
				<Pressable style={styles.counterBtn} onPress={() => onChange(Math.max(min, value - 1))}>
					<MaterialIcons name='remove' size={20} color='#8AB4F8' />
				</Pressable>
				<Text style={styles.counterVal}>{value}</Text>
				<Pressable style={styles.counterBtn} onPress={() => onChange(Math.min(max, value + 1))}>
					<MaterialIcons name='add' size={20} color='#8AB4F8' />
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		padding: 16,
		gap: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
	},
	eyebrow: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	title: {
		color: '#fff',
		fontSize: 28,
		fontWeight: '900',
	},
	tabRow: {
		flexDirection: 'row',
		gap: 6,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 4,
	},
	tab: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 9,
		borderRadius: 6,
	},
	tabActive: { backgroundColor: '#8AB4F8' },
	tabText: { color: '#8AB4F8', fontSize: 12, fontWeight: '800' },
	tabTextActive: { color: '#101113' },
	field: { gap: 6 },
	label: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	input: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
		padding: 14,
	},
	codeInput: {
		fontSize: 32,
		fontWeight: '900',
		letterSpacing: 10,
		textAlign: 'center',
	},
	variantRow: { flexDirection: 'row', gap: 8 },
	variantBtn: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
	},
	variantBtnActive: { backgroundColor: '#8AB4F8', borderColor: '#8AB4F8' },
	variantBtnText: { color: '#fff', fontSize: 22, fontWeight: '900' },
	variantBtnTextActive: { color: '#101113' },
	countersRow: { flexDirection: 'row', gap: 10 },
	counterCard: {
		flex: 1,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 14,
		gap: 10,
	},
	counterLabel: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	counterControls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	counterBtn: {
		width: 38,
		height: 38,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		backgroundColor: '#242424',
	},
	counterVal: {
		color: '#fff',
		fontSize: 30,
		fontWeight: '900',
		minWidth: 40,
		textAlign: 'center',
	},
	actionBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		backgroundColor: '#60D394',
		borderRadius: 8,
		paddingVertical: 16,
		marginTop: 4,
	},
	actionBtnDisabled: { opacity: 0.6 },
	actionBtnText: { color: '#101113', fontSize: 16, fontWeight: '900' },
});
