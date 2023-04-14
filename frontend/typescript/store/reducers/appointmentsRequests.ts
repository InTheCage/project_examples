import { EAppointmentRequestsActions } from '../../enums/actions.enum';
import { IAppointmentsRequestsState, TAppointmentsRequestsActions } from '../../interfaces/appointmentsRequests';

const initState: IAppointmentsRequestsState = {
	appointmentsRequests: null,
	appointmentRequest: null,
};

const initialState: IAppointmentsRequestsState = { ...initState };

export const appointmentsRequestsReducer = (
	state = initialState,
	action: TAppointmentsRequestsActions,
): IAppointmentsRequestsState => {
	switch (action.type) {
		case EAppointmentRequestsActions.SetAppointmentsRequests: {
			return { ...state, appointmentsRequests: action.payload };
		}

		case EAppointmentRequestsActions.SetAppointmentRequest: {
			return { ...state, appointmentRequest: action.payload };
		}
		default:
			return state;
	}
};
