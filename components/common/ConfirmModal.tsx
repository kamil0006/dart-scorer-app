import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	visible: boolean;
	title: string;
	message: string;
	cancelText: string;
	confirmText: string;
	icon?: keyof typeof MaterialIcons.glyphMap;
	variant?: 'danger' | 'primary';
	onCancel: () => void;
	onConfirm: () => void;
};

export default function ConfirmModal({
	visible,
	title,
	message,
	cancelText,
	confirmText,
	icon = 'help-outline',
	variant = 'danger',
	onCancel,
	onConfirm,
}: Props) {
	const accent = variant === 'danger' ? '#D94A5A' : '#8AB4F8';

	return (
		<Modal visible={visible} transparent={true} animationType='fade' onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={styles.content}>
					<MaterialIcons name={icon} size={30} color={accent} />
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.message}>{message}</Text>
					<View style={styles.actions}>
						<Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
							<Text style={styles.cancelText}>{cancelText}</Text>
						</Pressable>
						<Pressable
							style={[styles.button, variant === 'danger' ? styles.dangerButton : styles.primaryButton]}
							onPress={onConfirm}>
							<Text style={variant === 'danger' ? styles.dangerText : styles.primaryText}>{confirmText}</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.72)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	content: {
		width: '100%',
		maxWidth: 330,
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#333',
		padding: 22,
		alignItems: 'center',
	},
	title: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
		textAlign: 'center',
		marginTop: 12,
	},
	message: {
		color: '#ccc',
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center',
		marginTop: 10,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 20,
		width: '100%',
	},
	button: {
		flex: 1,
		minHeight: 44,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelButton: {
		backgroundColor: '#333',
	},
	dangerButton: {
		backgroundColor: '#D94A5A',
	},
	primaryButton: {
		backgroundColor: '#8AB4F8',
	},
	cancelText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '800',
	},
	dangerText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '900',
	},
	primaryText: {
		color: '#101113',
		fontSize: 14,
		fontWeight: '900',
	},
});
