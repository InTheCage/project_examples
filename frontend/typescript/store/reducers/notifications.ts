import { ENotificationsActions } from '../../enums/actions.enum';
import { INotificationsState, TNotificationsActions } from '../../interfaces/notifications';

const initState: INotificationsState = {
	isOpen: false,
	lastNotification: null,
};

const initialState = { ...initState };

export const notificationsReducer = (state = initialState, action: TNotificationsActions): INotificationsState => {
	switch (action.type) {
		case ENotificationsActions.setConnectionIsOpen:
			return { ...state, isOpen: action.payload };
		case ENotificationsActions.setLastNotification:
			return { ...state, lastNotification: action.payload };
		default:
			return state;
	}
};
