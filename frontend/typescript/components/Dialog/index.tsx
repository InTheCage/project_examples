import { memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useOutsideClick } from '../../hooks';

import Button from '../Button';

import { dialogSelector } from '../../store/selectors/dialogSelectors';
import { cancelDialogAction } from '../../store/actions/dialog';

import { ECustomButtonTypes } from '../../enums/button-types.enum';
import './Dialog.scss';

function Modal() {
	const dispatch = useDispatch();

	const {
		onClose,
		titleText,
		visible,
		content,
		loading,
		onOk,
		onOkText,
		onCancelText,
		onCancel,
		autoClose,
		maxWidth,
		buttonOkType,
		buttonOkFormId,
		footer,
	} = useSelector(dialogSelector);

	const handleOutsideClick = () => onClose?.();
	const outsideClickRef = useOutsideClick(handleOutsideClick);

	const handleOk = () => {
		onOk && onOk();
		autoClose && dispatch(cancelDialogAction());
	};

	const handleCancel = () => {
		onCancel && onCancel();
		autoClose && dispatch(cancelDialogAction());
	};

	const handleClose = () => {
		onClose && onClose();
		autoClose && dispatch(cancelDialogAction());
	};

	const styles = {
		maxWidth: maxWidth || 'inherit',
	};

	return visible ? (
		<div className="dialog__overlay">
			<div className="dialog" ref={outsideClickRef} style={styles}>
				<div className="dialog__header">
					<div className="dialog-title">{titleText}</div>
					<div className="dialog__close" onClick={handleClose} role="button" tabIndex={0}>
						X
					</div>
				</div>
				<div className="dialog__content">{content}</div>
				<div className="dialog__footer">
					{footer}
					<div className="dialog__ok-button">
						<Button
							onClick={handleOk}
							// eslint-disable-next-line react/button-has-type
							buttontype={ECustomButtonTypes.default}
							type={!!buttonOkType && buttonOkFormId ? 'submit' : buttonOkType}
							form={`${buttonOkFormId}`}
							disabled={loading}
						>
							{onOkText || 'ДА'}
						</Button>
					</div>
					<div className="dialog__cancel-button">
						<Button
							onClick={handleCancel}
							type="button"
							buttontype={ECustomButtonTypes.borderBlue}
							disabled={loading}
						>
							{onCancelText || 'НЕТ'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	) : (
		<></>
	);
}

export default memo(Modal);
