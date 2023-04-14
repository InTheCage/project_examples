import { INotification, ISetIsOpenConnection, ISetLastNotification } from '../../interfaces/notifications';
import { ENotificationsActions } from '../../enums/actions.enum';

export const setConnectionOpenAction = (payload: boolean): ISetIsOpenConnection => ({
	type: ENotificationsActions.setConnectionIsOpen,
	payload,
});
export const setLastNotification = (payload: INotification): ISetLastNotification => ({
	type: ENotificationsActions.setLastNotification,
	payload,
});
