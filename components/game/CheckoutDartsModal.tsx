import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCheckoutDartOptions } from '../../lib/gameRules';
import { useLanguage } from '../../lib/LanguageContext';

type Props = {
	visible: boolean;
	checkout?: string;
	isAdvanced?: boolean;
	actualDarts?: number;
	onSave: (darts: number) => void;
	onClose: () => void;
};

export default function CheckoutDartsModal({ visible, checkout, isAdvanced, actualDarts = 1, onSave, onClose }: Props) {
	const { strings } = useLanguage();
	const options = isAdvanced ? [actualDarts] : getCheckoutDartOptions(checkout);

	return (
		<Modal visible={visible} transparent={true} animationType='fade' onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.content}>
					<Text style={styles.title}>{strings.checkoutDartsQuestion}</Text>
					<Text style={styles.message}>
						{strings.checkout}: {checkout || ''}
					</Text>
					<View style={styles.dartsButtons}>
						{options.map(darts => (
							<Pressable key={darts} style={styles.dartsButton} onPress={() => onSave(darts)}>
								<Text style={styles.dartsButtonText}>{darts}</Text>
							</Pressable>
						))}
					</View>
					<Pressable style={styles.cancelButton} onPress={onClose}>
						<Text style={styles.cancelButtonText}>{strings.cancel}</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		backgroundColor: '#1E1E1E',
		borderRadius: 16,
		padding: 24,
		width: '80%',
		maxWidth: 400,
	},
	title: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 12,
		textAlign: 'center',
	},
	message: {
		color: '#aaa',
		fontSize: 14,
		marginBottom: 20,
		textAlign: 'center',
	},
	dartsButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
		gap: 12,
	},
	dartsButton: {
		flex: 1,
		backgroundColor: '#8AB4F8',
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
	},
	dartsButtonText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButton: {
		marginTop: 8,
		paddingVertical: 12,
		alignItems: 'center',
	},
	cancelButtonText: {
		color: '#aaa',
		fontSize: 14,
	},
});
