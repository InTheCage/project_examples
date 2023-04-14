import { EDialogActions } from '../../enums/actions.enum';
import { EButtonTypes } from '../../enums/button-types.enum';
import { IDialogState, TDialogAction } from '../../interfaces/dialog';

const initState: IDialogState = {
	visible: false,
	onOk: null,
	content: null,
	onClose: null,
	onCancel: null,
	onOkText: null,
	onCancelText: null,
	titleText: null,
	loading: false,
	autoClose: true,
	buttonOkFormId: null,
	maxWidth: undefined,
	buttonOkType: EButtonTypes.button,
	footer: null,
};

const initialState: IDialogState = { ...initState };

export const dialogReducer = (state = initialState, action: TDialogAction): IDialogState => {
	switch (action.type) {
		case EDialogActions.SetDialog: {
			return {
				...state,
				visible: true,
				...action.payload,
			};
		}
		case EDialogActions.CancelDialog: {
			return {
				...initState,
			};
		}
		case EDialogActions.SetLoading: {
			return {
				...state,
				loading: action.payload,
			};
		}
		default:
			return state;
	}
};
