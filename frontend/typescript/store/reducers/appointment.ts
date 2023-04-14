import { IAppointmentState, TAppointmentAction } from '../../interfaces/appointment';
import { EAppointmentActions } from '../../enums/actions.enum';

const initState: IAppointmentState = {
	currentStep: null,
	valuesCreateAppointment: {},
	stepsHistory: [],
	medicineDirections: [],
	doctors: [],
	schedule: [],
	appointmentData: null,
	loadingPage: false,
	isRedirect: false,
	slots: null,
	smsDelay: null,
	serverErrorCreateAppointment: null,
	isFastAppointment: false,
};

const initialState: IAppointmentState = { ...initState };

export const appointmentReducer = (state = initialState, action: TAppointmentAction): IAppointmentState => {
	switch (action.type) {
		case EAppointmentActions.SetCurrentStep: {
			if (action.payload === [...state.stepsHistory].pop()) return state;
			return {
				...state,
				currentStep: action.payload,
				stepsHistory: [...state.stepsHistory, action.payload],
			};
		}
		case EAppointmentActions.SetIsFastAppointment:
			return { ...state, isFastAppointment: action.payload };
		case EAppointmentActions.BackStep: {
			const copyState = [...state.stepsHistory];
			copyState.splice(copyState.length - (action.payload || 1), action.payload || 1);
			const [lastStep, ..._rest] = [...copyState].reverse();
			if (!lastStep) return state;
			return {
				...state,
				currentStep: lastStep,
				stepsHistory: [...copyState],
			};
		}
		case EAppointmentActions.SetValuesCreateAppointment: {
			return {
				...state,
				valuesCreateAppointment: { ...state.valuesCreateAppointment, ...action.payload },
			};
		}
		case EAppointmentActions.SetMedicineDirections: {
			return {
				...state,
				medicineDirections: action.payload,
			};
		}
		case EAppointmentActions.SetDoctors: {
			return { ...state, doctors: action.payload };
		}
		case EAppointmentActions.SetDoctorSchedule: {
			return { ...state, schedule: action.payload };
		}
		case EAppointmentActions.SetSlots: {
			return { ...state, slots: action.payload };
		}
		case EAppointmentActions.SetAppointmentData: {
			return { ...state, appointmentData: action.payload };
		}
		case EAppointmentActions.SetSmsDelay: {
			return { ...state, smsDelay: action.payload };
		}
		case EAppointmentActions.SetServerErrorCreateAppointment: {
			return { ...state, serverErrorCreateAppointment: action.payload };
		}
		case EAppointmentActions.ResetState: {
			return { ...initState };
		}
		default:
			return state;
	}
};
