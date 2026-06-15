import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameVariant, STARTING_SCORE } from '../lib/gameVariant';
import { useLanguage } from '../lib/LanguageContext';
import { getDisplayClientId, getDisplayPlayerName, getDisplayServerUrl, setDisplayServerUrl } from '../lib/settings';
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
	const [serverUrl, setServerUrlState] = useState('');
	const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
	const [variant, setVariant] = useState<GameVariant>('501');
	const [legs, setLegs] = useState(1);
	const [sets, setSets] = useState(1);
	const [joinCode, setJoinCode] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		getDisplayPlayerName().then(setPlayerName);
		getDisplayServerUrl().then(setServerUrlState);
	}, []);

	const handleServerUrlChange = async (value: string) => {
		setServerUrlState(value);
		setTestStatus('idle');
		await setDisplayServerUrl(value);
	};

	const handleTestConnection = async () => {
		const url = normalizeUrl(serverUrl);
		if (!url) return;
		setTestStatus('testing');
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);
			const r = await fetch(`${url}/api/state`, { signal: controller.signal });
			clearTimeout(timeout);
			setTestStatus(r.ok ? 'ok' : 'fail');
		} catch {
			setTestStatus('fail');
		}
	};

	const handleCreate = async () => {
		if (!playerName.trim()) {
			Alert.alert(strings.error, strings.mpEnterName);
			return;
		}
		const resolvedUrl = normalizeUrl(serverUrl);
		if (!resolvedUrl) {
			setTestStatus('fail');
			return;
		}
		setLoading(true);
		try {
			const playerId = await getDisplayClientId();
			const r = await fetch(`${resolvedUrl}/api/rooms`, {
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
			if (!r.ok) {
				setTestStatus('fail');
				return;
			}
			const room = await r.json();
			navigation.navigate('RoomLobby', { roomCode: room.code, playerId, playerName: playerName.trim(), serverUrl: resolvedUrl });
		} catch {
			setTestStatus('fail');
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
		const resolvedUrl = normalizeUrl(serverUrl);
		if (!resolvedUrl) {
			setTestStatus('fail');
			return;
		}
		setLoading(true);
		try {
			const playerId = await getDisplayClientId();
			const r = await fetch(`${resolvedUrl}/api/rooms/${code}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: playerId, name: playerName.trim() }),
			});
			if (r.ok) {
				const room = await r.json();
				const mySeat = room.players.findIndex((p: any) => p.id === playerId);
				navigation.navigate('RoomGame', {
					roomCode: code,
					playerId,
					playerName: playerName.trim(),
					serverUrl: resolvedUrl,
					seat: mySeat >= 0 ? mySeat : 1,
				});
			} else if (r.status === 400 || r.status === 404) {
				const err = await r.json().catch(() => ({}));
				Alert.alert(strings.error, err.error || strings.mpJoinError);
			} else {
				setTestStatus('fail');
			}
		} catch {
			setTestStatus('fail');
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

			<View style={styles.serverCard}>
				<Text style={styles.serverLabel}>{strings.displayLaptopAddress}</Text>
				<View style={styles.serverRow}>
					<TextInput
						style={styles.serverInput}
						value={serverUrl}
						onChangeText={handleServerUrlChange}
						autoCapitalize='none'
						autoCorrect={false}
						keyboardType='url'
						placeholder='http://192.168.1.50:3000'
						placeholderTextColor='#555'
					/>
					<Pressable
						style={[
							styles.testBtn,
							testStatus === 'ok' && styles.testBtnOk,
							testStatus === 'fail' && styles.testBtnFail,
						]}
						onPress={handleTestConnection}
						disabled={testStatus === 'testing'}>
						{testStatus === 'testing' ? (
							<ActivityIndicator size='small' color='#8AB4F8' />
						) : testStatus === 'ok' ? (
							<MaterialIcons name='check-circle' size={20} color='#60D394' />
						) : testStatus === 'fail' ? (
							<MaterialIcons name='error-outline' size={20} color='#FF6B6B' />
						) : (
							<MaterialIcons name='wifi-tethering' size={20} color='#8AB4F8' />
						)}
					</Pressable>
				</View>

				{!serverUrl.trim() && testStatus === 'idle' && (
					<View style={[styles.statusBanner, styles.statusBannerHint]}>
						<MaterialIcons name='info-outline' size={14} color='#8AB4F8' />
						<Text style={styles.statusBannerTextHint}>{strings.mpServerHint}</Text>
					</View>
				)}
				{testStatus === 'fail' && (
					<View style={styles.statusBanner}>
						<MaterialIcons name='error-outline' size={14} color='#FF6B6B' />
						<Text style={styles.statusBannerTextFail}>{strings.mpServerErrorMsg}</Text>
					</View>
				)}
				{testStatus === 'ok' && (
					<View style={[styles.statusBanner, styles.statusBannerOk]}>
						<MaterialIcons name='check-circle' size={14} color='#60D394' />
						<Text style={styles.statusBannerTextOk}>{strings.mpServerConnected}</Text>
					</View>
				)}
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
	serverCard: {
		backgroundColor: '#1A1A1A',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 14,
		gap: 10,
	},
	serverLabel: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	serverRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	serverInput: {
		flex: 1,
		backgroundColor: '#101113',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#333',
		color: '#fff',
		fontSize: 13,
		fontWeight: '700',
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	testBtn: {
		width: 42,
		height: 42,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3A4A',
		backgroundColor: '#23272E',
		flexShrink: 0,
	},
	testBtnOk: {
		borderColor: '#1D3A2A',
		backgroundColor: '#121F18',
	},
	testBtnFail: {
		borderColor: '#3A1A1A',
		backgroundColor: '#1F1212',
	},
	statusBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#1F1212',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#3A1A1A',
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	statusBannerOk: {
		backgroundColor: '#121F18',
		borderColor: '#1D3A2A',
	},
	statusBannerHint: {
		backgroundColor: '#1A2230',
		borderColor: '#2A3A4A',
	},
	statusBannerTextFail: {
		flex: 1,
		color: '#FF6B6B',
		fontSize: 12,
		fontWeight: '700',
		lineHeight: 16,
	},
	statusBannerTextOk: {
		flex: 1,
		color: '#60D394',
		fontSize: 12,
		fontWeight: '700',
	},
	statusBannerTextHint: {
		flex: 1,
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '700',
		lineHeight: 16,
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
