import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ConfirmModal from './common/ConfirmModal';
import { useLanguage } from '../lib/LanguageContext';

const IMPOSSIBLE_THREE_DART_SCORES = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179]);

export type NumpadProps = {
	onCommit?: (pts: number) => void;
	onCommitRaw?: (raw: string) => void;
	onUndo: () => void;
	extended?: boolean;
};

export default function Numpad({ onCommit, onCommitRaw, onUndo, extended = false }: NumpadProps) {
	const { strings } = useLanguage();
	const [buffer, setBuffer] = useState<string>('');
	const [showUndoConfirm, setShowUndoConfirm] = useState(false);
	const isRawMode = Boolean(onCommitRaw);

	const validation = useMemo(() => validateTurnScore(buffer, isRawMode), [buffer, isRawMode]);
	const canCommit = validation.canCommit;

	const push = (value: string) =>
		setBuffer(current => {
			const next = (current + value).toUpperCase().slice(0, 3);
			const pattern = isRawMode ? /^[0-9DTB]+$/ : /^[0-9]+$/;
			if (!pattern.test(next)) return current;
			return next;
		});

	const del = () => setBuffer(current => current.slice(0, -1));
	const clear = () => setBuffer('');

	const commit = () => {
		if (!canCommit) return;

		if (onCommitRaw) {
			onCommitRaw(buffer);
		} else if (onCommit) {
			onCommit(Number(buffer));
		}

		clear();
	};

	const requestUndoTurn = () => {
		setShowUndoConfirm(true);
	};

	const confirmUndoTurn = () => {
		setShowUndoConfirm(false);
		onUndo();
	};

	const basicKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
	const extKeys = ['D', 'T', 'SB', 'DB'];
	const keys = extended ? basicKeys.concat(extKeys) : basicKeys;

	return (
		<View style={styles.wrapper}>
			<View style={[styles.displayCard, validation.isInvalid && styles.displayCardInvalid]}>
				<Text style={styles.displayLabel}>{strings.roundScore}</Text>
				<Text style={styles.display}>{buffer || '0'}</Text>
				<Text style={[styles.displayHint, validation.isInvalid && styles.displayHintInvalid]}>
					{validation.isInvalid ? strings.invalidTurnScore : strings.points}
				</Text>
			</View>

			<View style={styles.grid}>
				{keys.map(key => (
					<Key
						key={key}
						onPress={() => push(key === 'SB' ? '25' : key === 'DB' ? '50' : key)}
						dark={extended && (key === 'D' || key === 'T')}
						wide={extended && (key === 'SB' || key === 'DB')}>
						<Text style={styles.keyText}>{key}</Text>
					</Key>
				))}
			</View>

			<View style={styles.actionRow}>
				<Key onPress={del} dark wide disabled={!buffer}>
					<MaterialIcons name='backspace' size={23} color={buffer ? '#fff' : '#777'} />
				</Key>
				<Key onPress={requestUndoTurn} dark wide>
					<MaterialIcons name='delete-sweep' size={25} color='#fff' />
				</Key>
				<Key onPress={commit} confirm wide disabled={!canCommit}>
					<MaterialIcons name='check-circle' size={22} color={canCommit ? '#0B0B0B' : '#A6DDB5'} />
					<Text style={[styles.commitText, !canCommit && styles.commitTextDisabled]}>{strings.turn}</Text>
				</Key>
			</View>

			<ConfirmModal
				visible={showUndoConfirm}
				title={strings.undoTurnConfirm}
				message={strings.undoTurnWhileTypingMessage}
				cancelText={strings.cancel}
				confirmText={strings.confirm}
				icon='delete-sweep'
				onCancel={() => setShowUndoConfirm(false)}
				onConfirm={confirmUndoTurn}
			/>
		</View>
	);
}

function validateTurnScore(buffer: string, isRawMode: boolean) {
	if (!buffer) return { canCommit: false, isInvalid: false };
	if (isRawMode) return { canCommit: true, isInvalid: false };

	const score = Number(buffer);
	const isInvalid = Number.isNaN(score) || score > 180 || IMPOSSIBLE_THREE_DART_SCORES.has(score);
	return { canCommit: !isInvalid, isInvalid };
}

function Key({
	onPress,
	wide = false,
	dark = false,
	confirm = false,
	disabled = false,
	children,
}: {
	onPress: () => void;
	wide?: boolean;
	dark?: boolean;
	confirm?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Pressable
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.key,
				wide && styles.wide,
				dark && styles.dark,
				confirm && styles.confirm,
				disabled && !confirm && styles.disabled,
				disabled && confirm && styles.confirmDisabled,
				pressed && styles.pressed,
			]}>
			{children}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		alignItems: 'center',
		gap: 12,
		marginBottom: 32,
		width: '100%',
	},
	displayCard: {
		width: '100%',
		maxWidth: 320,
		minHeight: 112,
		backgroundColor: '#1A1A1A',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
	},
	displayCardInvalid: {
		borderColor: '#D94A5A',
	},
	displayLabel: {
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	display: {
		color: '#FAFAFA',
		fontSize: 48,
		fontWeight: '900',
		letterSpacing: 0,
		fontVariant: ['tabular-nums'],
		marginTop: 4,
	},
	displayHint: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '700',
		marginTop: 2,
	},
	displayHintInvalid: {
		color: '#FF6B6B',
	},
	grid: {
		width: '100%',
		maxWidth: 320,
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		justifyContent: 'center',
	},
	actionRow: {
		width: '100%',
		maxWidth: 320,
		flexDirection: 'row',
		gap: 10,
		justifyContent: 'center',
	},
	key: {
		width: 70,
		height: 62,
		borderRadius: 12,
		backgroundColor: '#1F1F1F',
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 6,
	},
	wide: {
		flex: 1,
		minWidth: 0,
	},
	dark: {
		backgroundColor: '#333',
	},
	confirm: {
		backgroundColor: '#60D394',
	},
	confirmDisabled: {
		backgroundColor: '#22352A',
		borderWidth: 1,
		borderColor: '#60D394',
	},
	disabled: {
		opacity: 0.48,
	},
	pressed: {
		opacity: 0.62,
	},
	keyText: {
		color: '#FFF',
		fontSize: 24,
		fontWeight: '700',
	},
	commitText: {
		color: '#0B0B0B',
		fontSize: 15,
		fontWeight: '900',
	},
	commitTextDisabled: {
		color: '#A6DDB5',
	},
});
