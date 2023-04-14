import { EDialogActions } from '../../enums/actions.enum';
import { IDialogPayload, TDialogAction } from '../../interfaces/dialog';

export const setDialogAction = (payload: IDialogPayload): TDialogAction => ({
	type: EDialogActions.SetDialog,
	payload,
});

export const cancelDialogAction = (): TDialogAction => ({
	type: EDialogActions.CancelDialog,
});

export const setLoadingDialogAction = (payload: boolean): TDialogAction => ({
	type: EDialogActions.SetLoading,
	payload,
});
