import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
	label: string;
	value: string | number;
	icon?: keyof typeof MaterialIcons.glyphMap;
	isAdvanced?: boolean;
};

export default function StatCard({ label, value, icon, isAdvanced }: Props) {
	const valueText = String(value);
	const isLongValue = valueText.length > 10;

	return (
		<View style={[styles.card, isAdvanced && styles.advancedCard]}>
			{icon && <MaterialIcons name={icon} size={24} color='#8AB4F8' style={styles.icon} />}
			<Text
				style={[styles.value, isLongValue && styles.longValue]}
				numberOfLines={2}
				adjustsFontSizeToFit
				minimumFontScale={0.55}>
				{valueText}
			</Text>
			<Text style={styles.label}>{label}</Text>
			{isAdvanced && <View style={styles.advancedIndicator} />}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		width: '30%',
		minWidth: 100,
		aspectRatio: 1,
		backgroundColor: '#23272E',
		borderRadius: 8,
		margin: 6,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		elevation: 2,
	},
	icon: {
		marginBottom: 4,
	},
	value: {
		color: '#fff',
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 2,
		textAlign: 'center',
		paddingHorizontal: 4,
	},
	longValue: {
		fontSize: 18,
	},
	label: {
		color: '#8AB4F8',
		fontSize: 13,
		textAlign: 'center',
	},
	advancedCard: {
		borderWidth: 2,
		borderColor: '#8AB4F8',
	},
	advancedIndicator: {
		position: 'absolute',
		top: 4,
		right: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#8AB4F8',
	},
});
