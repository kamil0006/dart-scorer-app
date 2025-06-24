import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
	visible: boolean;
	onClose: () => void;
	onConfirm: (pts: number) => void;
	initial?: number | null;
};

export default function ManualInputModal({ visible, onClose, onConfirm, initial = null }: Props) {
	const [value, setValue] = useState<string>(initial?.toString() ?? '');

	const confirm = () => {
		const pts = Number(value);
		if (Number.isNaN(pts) || pts < 0 || pts > 180) {
			Alert.alert('Błąd', 'Wpisz liczbę od 0 do 180');
			return;
		}
		onConfirm(pts);
		setValue('');
	};

	return (
		<Modal transparent animationType='slide' visible={visible} onRequestClose={onClose}>
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>Wpisz liczbę punktów</Text>
					<TextInput style={styles.input} keyboardType='number-pad' value={value} onChangeText={setValue} autoFocus />
					<View style={styles.row}>
						<Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
							<Text style={styles.btntxt}>Anuluj</Text>
						</Pressable>
						<Pressable style={styles.btn} onPress={confirm}>
							<Text style={styles.btntxt}>OK</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: '#0009',
		alignItems: 'center',
		justifyContent: 'center',
	},
	card: {
		width: '80%',
		backgroundColor: '#222',
		borderRadius: 12,
		padding: 24,
		gap: 16,
	},
	title: { fontSize: 18, color: '#fff', textAlign: 'center' },
	input: {
		backgroundColor: '#333',
		borderRadius: 8,
		padding: 12,
		fontSize: 20,
		color: '#fff',
		textAlign: 'center',
	},
	row: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
	btn: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: '#60D394',
		borderRadius: 8,
	},
	cancel: { backgroundColor: '#666' },
	btntxt: { color: '#fff', fontWeight: '600' },
});
