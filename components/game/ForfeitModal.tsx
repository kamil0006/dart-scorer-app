import React from 'react';

import ConfirmModal from '../common/ConfirmModal';
import { useLanguage } from '../../lib/LanguageContext';

type Props = {
	visible: boolean;
	title?: string;
	message?: string;
	confirmText?: string;
	onConfirm: () => void;
	onClose: () => void;
};

export default function ForfeitModal({ visible, title, message, confirmText, onConfirm, onClose }: Props) {
	const { strings } = useLanguage();

	return (
		<ConfirmModal
			visible={visible}
			title={title ?? strings.forfeitConfirm}
			message={message ?? strings.forfeitMessage}
			cancelText={strings.cancel}
			confirmText={confirmText ?? strings.forfeit}
			icon='flag'
			onCancel={onClose}
			onConfirm={onConfirm}
		/>
	);
}
