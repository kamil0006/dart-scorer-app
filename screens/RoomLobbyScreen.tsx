import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConfirmModal from '../components/common/ConfirmModal';
import { useLanguage } from '../lib/LanguageContext';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'RoomLobby'>;

type RoomState = {
	code: string;
	status: string;
	startScore: number;
	setsTarget: number;
	legsTarget: number;
	players: { id: string; name: string; seat: number | null }[];
};

export default function RoomLobbyScreen({ navigation, route }: Props) {
	const { roomCode, playerId, playerName, serverUrl } = route.params;
	const { strings } = useLanguage();
	const [room, setRoom] = useState<RoomState | null>(null);
	const [starting, setStarting] = useState(false);
	const [starterSeat, setStarterSeat] = useState(0);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const cancelledRef = useRef(false);
	const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const poll = useCallback(async () => {
		if (cancelledRef.current) return;
		try {
			const r = await fetch(`${serverUrl}/api/rooms/${roomCode}`);
			if (r.ok && !cancelledRef.current) {
				const data: RoomState = await r.json();
				setRoom(data);
				if (data.status === 'playing') {
					cancelledRef.current = true;
					const seat = data.players.findIndex(p => p.id === playerId);
					navigation.replace('RoomGame', { roomCode, playerId, playerName, serverUrl, seat: seat >= 0 ? seat : 0 });
					return;
				}
			}
		} catch {}
		if (!cancelledRef.current) {
			pollingRef.current = setTimeout(poll, 1500);
		}
	}, [serverUrl, roomCode, playerId, playerName, navigation]);

	useEffect(() => {
		poll();
		return () => {
			cancelledRef.current = true;
			if (pollingRef.current) clearTimeout(pollingRef.current);
		};
	}, [poll]);

	useFocusEffect(
		useCallback(() => {
			const sub = BackHandler.addEventListener('hardwareBackPress', () => {
				setShowCancelModal(true);
				return true;
			});
			return () => sub.remove();
		}, [])
	);

	const handleStart = async () => {
		if (!room || room.players.length < 2) return;
		setStarting(true);
		try {
			const r = await fetch(`${serverUrl}/api/rooms/${roomCode}/start`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId, starterSeat }),
			});
			if (r.ok) {
				cancelledRef.current = true;
				const seat = room.players.findIndex(p => p.id === playerId);
				navigation.replace('RoomGame', { roomCode, playerId, playerName, serverUrl, seat: seat >= 0 ? seat : 0 });
			} else {
				const err = await r.json().catch(() => ({}));
				Alert.alert(strings.error, err.error || strings.error);
			}
		} catch {
			Alert.alert(strings.error, strings.error);
		} finally {
			setStarting(false);
		}
	};

	const bothJoined = (room?.players.length ?? 0) >= 2;
	const opponent = room?.players.find(p => p.id !== playerId);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => setShowCancelModal(true)} style={styles.backBtn}>
					<MaterialIcons name='arrow-back' size={22} color='#8AB4F8' />
				</Pressable>
				<View>
					<Text style={styles.eyebrow}>{strings.mpHostWaiting}</Text>
					<Text style={styles.title}>{strings.mpRoomCreated}</Text>
				</View>
			</View>

			<View style={styles.codeCard}>
				<Text style={styles.codeMeta}>{strings.mpRoomCode}</Text>
				<Text style={styles.codeValue}>{roomCode}</Text>
				<Text style={styles.codeHint}>{strings.mpShareCode}</Text>
			</View>

			{room && (
				<View style={styles.settingsRow}>
					<View style={styles.settingChip}>
						<Text style={styles.settingVal}>{room.startScore}</Text>
					</View>
					<View style={styles.settingChip}>
						<Text style={styles.settingLbl}>{strings.mpLegs}</Text>
						<Text style={styles.settingVal}>{room.legsTarget}</Text>
					</View>
					<View style={styles.settingChip}>
						<Text style={styles.settingLbl}>{strings.mpSets}</Text>
						<Text style={styles.settingVal}>{room.setsTarget}</Text>
					</View>
				</View>
			)}

			<View style={styles.playersCard}>
				<Text style={styles.playersLabel}>{strings.mpPlayers}</Text>
				<View style={styles.playerRow}>
					<View style={styles.dot} />
					<Text style={styles.playerName}>{playerName}</Text>
					<Text style={styles.playerRole}>{strings.mpHost}</Text>
				</View>
				<View style={[styles.playerRow, styles.playerRowLast]}>
					{bothJoined ? (
						<>
							<View style={styles.dot} />
							<Text style={styles.playerName}>{opponent?.name}</Text>
							<Text style={styles.readyBadge}>{strings.mpReady}</Text>
						</>
					) : (
						<>
							<View style={styles.dotEmpty} />
							<Text style={styles.waitingName}>{strings.mpWaitingForPlayer}</Text>
						</>
					)}
				</View>
			</View>

			{bothJoined && (
				<View style={styles.starterCard}>
					<Text style={styles.starterLabel}>{strings.mpWhoStarts}</Text>
					<Text style={styles.starterHint}>{strings.mpBullThrowHint}</Text>
					<View style={styles.starterRow}>
						{[playerName, opponent?.name ?? ''].map((name, idx) => (
							<Pressable
								key={idx}
								style={[styles.starterBtn, starterSeat === idx && styles.starterBtnActive]}
								onPress={() => setStarterSeat(idx)}
							>
								<Text style={[styles.starterBtnText, starterSeat === idx && styles.starterBtnTextActive]}>
									{name}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
			)}

			<Pressable
				style={[styles.startBtn, (!bothJoined || starting) && styles.startBtnDisabled]}
				onPress={handleStart}
				disabled={!bothJoined || starting}
			>
				<MaterialIcons name='play-arrow' size={26} color={bothJoined ? '#101113' : '#555'} />
				<Text style={[styles.startBtnText, !bothJoined && styles.startBtnTextDisabled]}>
					{starting ? strings.mpStarting : bothJoined ? strings.startGame : strings.mpWaitingForPlayer}
				</Text>
			</Pressable>

			<ConfirmModal
				visible={showCancelModal}
				title={strings.mpCancelRoom}
				message={strings.mpCancelRoomMessage}
				cancelText={strings.mpStay}
				confirmText={strings.cancel}
				icon='exit-to-app'
				variant='danger'
				onCancel={() => setShowCancelModal(false)}
				onConfirm={() => {
					cancelledRef.current = true;
					setShowCancelModal(false);
					navigation.goBack();
				}}
			/>
		</SafeAreaView>
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
	codeCard: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 24,
		alignItems: 'center',
		gap: 6,
	},
	codeMeta: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 2,
	},
	codeValue: {
		color: '#60D394',
		fontSize: 64,
		fontWeight: '900',
		letterSpacing: 12,
	},
	codeHint: {
		color: '#666',
		fontSize: 13,
		fontWeight: '600',
	},
	settingsRow: {
		flexDirection: 'row',
		gap: 8,
	},
	settingChip: {
		flex: 1,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 12,
		alignItems: 'center',
		gap: 2,
	},
	settingLbl: {
		color: '#888',
		fontSize: 10,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	settingVal: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '900',
	},
	playersCard: {
		flex: 1,
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 16,
		gap: 4,
	},
	playersLabel: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		marginBottom: 8,
	},
	playerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#242424',
	},
	playerRowLast: {
		borderBottomWidth: 0,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#60D394',
	},
	dotEmpty: {
		width: 10,
		height: 10,
		borderRadius: 5,
		borderWidth: 2,
		borderColor: '#444',
	},
	playerName: {
		flex: 1,
		color: '#fff',
		fontSize: 16,
		fontWeight: '800',
	},
	waitingName: {
		flex: 1,
		color: '#555',
		fontSize: 14,
		fontWeight: '600',
		fontStyle: 'italic',
	},
	playerRole: {
		color: '#888',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	readyBadge: {
		color: '#60D394',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	starterCard: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 16,
		gap: 8,
	},
	starterLabel: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	starterHint: {
		color: '#666',
		fontSize: 12,
		fontWeight: '600',
	},
	starterRow: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 4,
	},
	starterBtn: {
		flex: 1,
		backgroundColor: '#242424',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#333',
		paddingVertical: 12,
		alignItems: 'center',
	},
	starterBtnActive: {
		backgroundColor: '#1B2E4B',
		borderColor: '#8AB4F8',
	},
	starterBtnText: {
		color: '#888',
		fontSize: 14,
		fontWeight: '800',
	},
	starterBtnTextActive: {
		color: '#8AB4F8',
	},
	startBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		backgroundColor: '#60D394',
		borderRadius: 8,
		paddingVertical: 16,
	},
	startBtnDisabled: {
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#2A2A2A',
	},
	startBtnText: {
		color: '#101113',
		fontSize: 16,
		fontWeight: '900',
	},
	startBtnTextDisabled: {
		color: '#555',
	},
});
