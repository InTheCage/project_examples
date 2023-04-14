import { Dispatch } from 'redux';
import { EAppointmentRequestsActions } from '../../enums/actions.enum';
import {
	IAppointmentResponse,
	ISetAppointmentRequestAction,
	ISetAppointmentsRequestsAction,
} from '../../interfaces/appointmentsRequests';
import defaultErrorCallback from '../../utils/helpers/defaultErrorCallback';
import { getErrorString } from '../../utils/helpers/getErrorString';
import { appointmentApi } from '../../api';
import { IObjectQueries } from '../../utils/helpers/getQueryToObject';

export const setAppointmentsRequestsAction = (
	payload: IAppointmentResponse[] | null,
): ISetAppointmentsRequestsAction => ({
	type: EAppointmentRequestsActions.SetAppointmentsRequests,
	payload,
});

export const setAppointmentRequestAction = (payload: IAppointmentResponse | null): ISetAppointmentRequestAction => ({
	type: EAppointmentRequestsActions.SetAppointmentRequest,
	payload,
});

export const getAppointmentsRequestsThunk = (queryParams?: IObjectQueries[]) => async (dispatch: Dispatch) => {
	try {
		const { data: appointmentsRequests } = await appointmentApi.getAppointments(queryParams);
		dispatch(setAppointmentsRequestsAction(appointmentsRequests));
	} catch (err) {
		console.error(err);
		defaultErrorCallback({ errorMessage: getErrorString(err) });
	}
};
