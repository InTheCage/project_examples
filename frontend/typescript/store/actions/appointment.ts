import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../rootReducer';

import { EAppointmentActions } from '../../enums/actions.enum';
import { EAppointmentSteps } from '../../enums/appointmentSteps.enum';
import {
	IServerErrorCreateAppointmentAction,
	ISetDoctorsAction,
	ISetMedicineDirectionsAction,
	ISetSlotsAction,
	ISetSmsDelayAction,
	ISetValuesCreateAppointmentAction,
	TAppointmentAction,
	TValuesCreateAppointment,
	TScheduleResponse,
	IResetStateAction,
	IBackStepAction,
	ISetIsFastAppointmentAction,
	ISetAppointmentDataAction,
} from '../../interfaces/appointment';
import { ICreateAppointmentResponseData } from '../../interfaces/appointmentApi';
import { IWard } from '../../interfaces/profile';

import { getQueryToObject } from '../../utils/helpers';
import defaultErrorCallback from '../../utils/helpers/defaultErrorCallback';
import { IAppointmentObjectQueries } from '../../utils/helpers/getQueryToObject';

import { EAppointmentQueries } from '../../enums/appointmentQueries.enum';
import { isValidProperties } from '../../utils/helpers/isValidObj';
import { ISignInResponseData } from '../../interfaces/signinApi';
import { IServerError } from '../../interfaces';

export const setCurrentStepAction = (currentStep: EAppointmentSteps): TAppointmentAction => ({
	type: EAppointmentActions.SetCurrentStep,
	payload: currentStep,
});

export const setIsFastAppointmentAction = (
	payload: ISetIsFastAppointmentAction['payload'],
): ISetIsFastAppointmentAction => ({
	type: EAppointmentActions.SetIsFastAppointment,
	payload,
});

export const setValuesCreateAppointmentAction = (
	payload: TValuesCreateAppointment,
): ISetValuesCreateAppointmentAction => ({
	type: EAppointmentActions.SetValuesCreateAppointment,
	payload,
});

export const resetStateAction = (): IResetStateAction => ({
	type: EAppointmentActions.ResetState,
});

export const backStepAction = (countBack?: number): IBackStepAction => ({
	type: EAppointmentActions.BackStep,
	payload: countBack,
});

export const setSlotsAction = (payload: TScheduleResponse[]): ISetSlotsAction => ({
	type: EAppointmentActions.SetSlots,
	payload,
});

export const setSmsDelayAction = (payload: ISignInResponseData['delay'] | null): ISetSmsDelayAction => ({
	type: EAppointmentActions.SetSmsDelay,
	payload,
});

export const setServerErrorCreateAppointmentAction = (
	payload: IServerError | null,
): IServerErrorCreateAppointmentAction => ({
	type: EAppointmentActions.SetServerErrorCreateAppointment,
	payload,
});

export const setMedicineDirectionsThunk = (isChild?: IWard['is_child']): TSetMedicineDirectionsThunk => async (
	dispatch,
) => {
	try {
		const { data: medicineDirectionsResponse } = await appointmentApi.getDirections(isChild);
		dispatch({
			type: EAppointmentActions.SetMedicineDirections,
			payload: medicineDirectionsResponse,
		});
	} catch (error) {
		console.error(error);
	}
};

export interface IParamsGetDoctorsThunk {
	directionId?: string | number;
	isChild?: boolean;
	patientId?: TValuesCreateAppointment['patientId'];
}

export const getDoctorsThunk = ({
	directionId,
	patientId,
	isChild,
}: IParamsGetDoctorsThunk): TSetDoctorsThunk => async (dispatch) => {
	try {
		const { data: doctorsResponse } = await appointmentApi.getDoctorList({ directionId, patientId, isChild });
		dispatch({
			type: EAppointmentActions.SetDoctors,
			payload: doctorsResponse,
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

export const getScheduleThunk = (id: { doctorId: string } | { directionId: string }) => async (dispatch: Dispatch) => {
	try {
		const { data: schedule } = await appointmentApi.getSchedule(id);
		dispatch(setSlotsAction(schedule));
	} catch (error) {
		console.error(error);
		throw error;
	}
};

export const setAppointmentDataAction = (
	payload: ICreateAppointmentResponseData | null,
): ISetAppointmentDataAction => ({
	type: EAppointmentActions.SetAppointmentData,
	payload,
});

export const getAppointmentQueryThunk = (searchParams: string): TSetAppointmentQueryThunk => async (dispatch) => {
	const queries = getQueryToObject<IAppointmentObjectQueries>(searchParams);
	if (!isValidProperties(queries, Object.keys(EAppointmentQueries))) return;

	try {
		dispatch(setValuesCreateAppointmentAction(queries));
		await dispatch(setMedicineDirectionsThunk());
		await dispatch(getDoctorsThunk({ directionId: queries.currentBranch }));
		await dispatch(getScheduleThunk({ doctorId: queries.doctorId }));
		dispatch(setCurrentStepAction(EAppointmentSteps.timeSelectionStep));
	} catch (error) {
		console.error(error);
		defaultErrorCallback({
			errorMessage:
				'Произошла ошибка.',
		});
	}
};

type TSetMedicineDirectionsThunk = ThunkAction<void, RootState, unknown>;
type TSetDoctorsThunk = ThunkAction<void, RootState, unknown>;
type TSetAppointmentQueryThunk = ThunkAction<void, RootState, unknown, TAppointmentAction>;
