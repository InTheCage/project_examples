
import { profileReducer } from './reducers/profile';
import { appointmentReducer } from './reducers/appointment';
import { dialogReducer } from './reducers/dialog';
import { notificationsReducer } from './reducers/notifications';
import { documentsReducer } from './reducers/documents';
import { appointmentsRequestsReducer } from './reducers/appointmentsRequests';

const rootReducer = combineReducers({
	profile: profileReducer,
	dialog: dialogReducer,
	appointment: appointmentReducer,
	documents: documentsReducer,
	notifications: notificationsReducer,
	appointmentsRequests: appointmentsRequestsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
