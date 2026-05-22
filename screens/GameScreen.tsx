import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdvancedThrowPad from '../components/AdvancedThrowPad';
import ConfirmModal from '../components/common/ConfirmModal';
import CheckoutDartsModal from '../components/game/CheckoutDartsModal';
import CurrentTurnSlots from '../components/game/CurrentTurnSlots';
import DartboardHeatmap from '../components/game/DartboardHeatmap';
import ForfeitModal from '../components/game/ForfeitModal';
import TurnHistory from '../components/game/TurnHistory';
import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { useDartGame } from '../hooks/useDartGame';
import { useLanguage } from '../lib/LanguageContext';

type GameScreenProps = {
	route: {
		params: {
			initialScore: number;
		};
	};
	navigation: {
		goBack: () => void;
	};
};

export default function GameScreen({ route, navigation }: GameScreenProps): React.ReactElement {
	const { initialScore } = route.params;
	const { strings } = useLanguage();
	const game = useDartGame({ initialScore });
	const { state, actions } = game;
	const [showUndoTurnModal, setShowUndoTurnModal] = useState(false);
	const forfeitTitle = state.hasStarted ? strings.forfeitConfirm : strings.cancelGameConfirm;
	const forfeitMessage = state.hasStarted ? strings.forfeitMessage : strings.cancelGameMessage;
	const forfeitConfirmText = state.hasStarted ? strings.forfeit : strings.cancelGame;

	const handleForfeitConfirm = () => {
		if (state.hasStarted) {
			actions.confirmForfeit();
			return;
		}

		actions.closeForfeitModal();
		actions.resetGameState();
		navigation.goBack();
	};

	const confirmUndoAdvancedTurn = () => {
		actions.undoAdvancedTurn();
		setShowUndoTurnModal(false);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />
			{!state.gameOver && (
				<View style={styles.topActions}>
					<Pressable style={styles.forfeitButton} onPress={actions.openForfeitModal}>
						<MaterialIcons name='flag' size={18} color='#FFB4BE' />
						<Text style={styles.forfeitButtonText}>{state.hasStarted ? strings.forfeit : strings.cancel}</Text>
					</Pressable>
				</View>
			)}
			<ScrollView contentContainerStyle={[styles.scroll, state.gameOver && styles.scrollGameOver]}>
				{state.showBustNotice && (
					<View style={styles.bustNotice}>
						<MaterialIcons name='report' size={20} color='#fff' />
						<View style={styles.bustCopy}>
							<Text style={styles.bustTitle}>{strings.bust}</Text>
							<Text style={styles.bustMessage}>{strings.bustMessage}</Text>
						</View>
					</View>
				)}

				{state.advanced && state.gameOver ? (
					<Pressable style={styles.newGameBtn} onPress={actions.resetGameState}>
						<Text style={styles.newGameTxt}>{strings.newGameButton}</Text>
					</Pressable>
				) : (
					<ScoreBoard score={state.currentScore} average={state.average3d} checkout={state.checkout} />
				)}

				<TurnHistory
					turns={state.turns}
					canUndoTurn={state.canUndoAdvancedTurn}
					onUndoTurn={() => setShowUndoTurnModal(true)}
				/>

				{!state.advanced ? (
					<View style={styles.numpadBox}>
						<Numpad onCommit={actions.handleTurnEnd} onUndo={actions.undoSimpleTurn} extended={false} />
					</View>
				) : (
					<>
						<CurrentTurnSlots hits={state.hits} onUndo={actions.removeHit} />
						<AdvancedThrowPad onThrow={actions.onThrow} onUndo={actions.removeHit} />
						<DartboardHeatmap hits={state.gameHits} onThrow={actions.onThrow} />
					</>
				)}
			</ScrollView>

			<CheckoutDartsModal
				visible={state.showCheckoutDartsModal}
				checkout={state.pendingCheckoutData?.checkout}
				isAdvanced={state.pendingCheckoutData?.isAdvanced}
				actualDarts={state.actualCheckoutDarts}
				onSave={actions.handleSaveWithCheckoutDarts}
				onClose={actions.closeCheckoutDartsModal}
			/>
			<ForfeitModal
				visible={state.showForfeitModal}
				title={forfeitTitle}
				message={forfeitMessage}
				confirmText={forfeitConfirmText}
				onConfirm={handleForfeitConfirm}
				onClose={actions.closeForfeitModal}
			/>
			<ConfirmModal
				visible={showUndoTurnModal}
				title={strings.undoTurnConfirm}
				message={strings.undoTurnWhileTypingMessage}
				cancelText={strings.cancel}
				confirmText={strings.confirm}
				icon='delete-outline'
				onCancel={() => setShowUndoTurnModal(false)}
				onConfirm={confirmUndoAdvancedTurn}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
	},
	scroll: {
		padding: 16,
		paddingTop: 0,
		gap: 16,
		paddingBottom: 80,
	},
	scrollGameOver: {
		paddingTop: 8,
	},
	numpadBox: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
	newGameBtn: {
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 24,
		backgroundColor: '#60D394',
		borderRadius: 8,
		alignSelf: 'center',
	},
	newGameTxt: {
		color: '#000',
		fontSize: 16,
		fontWeight: '600',
	},
	topActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingHorizontal: 16,
		paddingTop: 6,
		paddingBottom: 8,
	},
	forfeitButton: {
		minHeight: 38,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: '#2A1519',
		borderRadius: 999,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: '#7A2634',
	},
	forfeitButtonText: {
		color: '#FFB4BE',
		fontSize: 12,
		fontWeight: '900',
	},
	bustNotice: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		gap: 10,
		backgroundColor: '#B00020',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		maxWidth: 360,
		width: '100%',
	},
	bustCopy: {
		flex: 1,
	},
	bustTitle: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '700',
	},
	bustMessage: {
		color: '#F5D4DA',
		fontSize: 12,
		marginTop: 2,
	},
});
