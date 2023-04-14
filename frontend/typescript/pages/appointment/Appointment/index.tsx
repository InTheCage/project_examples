import React, { memo, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
	currentStepSelector,
	isFastAppointmentSelector,
	stepsHistorySelector,
} from '../../../store/selectors/appointmentSelectors';
import {
	getAppointmentQueryThunk,
	setAppointmentDataAction,
	setCurrentStepAction,
	setIsFastAppointmentAction,
	setValuesCreateAppointmentAction,
} from '../../../store/actions/appointment';
import { profileIsAuthSelector } from '../../../store/selectors/profileSelectors';
import {
	ConfirmStep,
	CreatedStep,
	MedicineSelectionStep,
	TimeSelectionStep,
	WardsSelectionStep,
} from './steps';
import { EAppointmentSteps } from '../../../enums/appointmentSteps.enum';
import { Routes } from '../../../enums/routes.enum';
import { EAppointmentQueries } from '../../../enums/appointmentQueries.enum';

import { getQueryToObject } from '../../../utils/helpers';
import { isValidProperties } from '../../../utils/helpers/isValidObj';
import defaultErrorCallback from '../../../utils/helpers/defaultErrorCallback';
import { appointmentApi } from '../../../api';
import './Appointment.scss';

function Appointment() {
	const history = useHistory();
	const location = useLocation();
	const dispatch = useDispatch();

	const currentStep = useSelector(currentStepSelector);
	const stepsHistory = useSelector(stepsHistorySelector);
	const isFastAppointment = useSelector(isFastAppointmentSelector);
	const isAuth = useSelector(profileIsAuthSelector);

	const confirmSteps = [
		EAppointmentSteps.createdStepSmsConfirm,
		EAppointmentSteps.createdStepInsertPhone,
		EAppointmentSteps.createdStepSuccess,
		EAppointmentSteps.createdStepPaymentOption,
		EAppointmentSteps.createdAppointmentStep,
		EAppointmentSteps.createdStepError,
		EAppointmentSteps.error,
	];

	useEffect(() => {
		let initStep;
		switch (true) {
			case isFastAppointment:
				initStep = stepsHistory[stepsHistory.length - 1] || EAppointmentSteps.medicineSelectionStep;
				dispatch(setIsFastAppointmentAction(false));
				break;
			case isAuth:
				initStep =
					// проверка currentStep fix авторизации на последнем шаге 02.02.2022
					confirmSteps.some((step) => currentStep === step)
						? currentStep || EAppointmentSteps.wardSelectionStep
						: EAppointmentSteps.wardSelectionStep;
				break;
			default:
				initStep = EAppointmentSteps.medicineSelectionStep;
		}

		dispatch(setCurrentStepAction(initStep));
		dispatch(getAppointmentQueryThunk(history.location.search));
	}, []);

	useEffect(() => {
		async function handle() {
			if (!location.search) return;
			const queries = getQueryToObject(location.search);
			// eslint-disable-next-line no-prototype-builtins
			if ('paymentSuccess' in queries) {
				try {
					if (queries.appointmentId) {
						const { data: appointment } = await appointmentApi.getAppointment(queries.appointmentId);
						dispatch(setAppointmentDataAction(appointment));
						queries.paymentSuccess === 'true'
							? dispatch(setCurrentStepAction(EAppointmentSteps.createdStepSuccess))
							: dispatch(setCurrentStepAction(EAppointmentSteps.createdStepPaymentOption));
					}
				} catch (err) {
					history.push(`/${Routes.Appointment}`);
					defaultErrorCallback({ errorMessage: err?.response?.data?.errors?.detail || '' });
				}
			} else if (isValidProperties(queries, Object.keys(EAppointmentQueries))) {
				dispatch(setCurrentStepAction(EAppointmentSteps.timeSelectionStep));
			} else if ('currentBranch' in queries && Object.keys(queries).length === 1) {
				dispatch(setValuesCreateAppointmentAction({ currentBranch: queries.currentBranch }));
				history.replace(`/${Routes.Appointment}`);
			} else if ('currentBranch' in queries && Object.keys(queries).length === 2) {
				// пользователь пришёл из /chat по кнопке "Записаться на консультацию"
				dispatch(
					setValuesCreateAppointmentAction({
						currentBranch: queries.currentBranch,
					}),
				);
				dispatch(setCurrentStepAction(EAppointmentSteps.timeSelectionStep));
				history.replace(`/${Routes.Appointment}`);
			}
		}
		handle();
	}, [location.search]);

	return (
		<div className="appointment">
			{(() => {
				switch (currentStep) {
					case EAppointmentSteps.wardSelectionStep:
						return <WardsSelectionStep />;
					case EAppointmentSteps.timeSelectionStep:
						return <TimeSelectionStep />;
					case EAppointmentSteps.confirmAppointmentStep:
						return <ConfirmStep />;
					case EAppointmentSteps.createdAppointmentStep:
					case EAppointmentSteps.createdStepInsertPhone:
					case EAppointmentSteps.createdStepSuccess:
					case EAppointmentSteps.createdStepSmsConfirm:
					case EAppointmentSteps.createdStepPaymentOption:
					case EAppointmentSteps.createdStepError:
					case EAppointmentSteps.error:
						return <CreatedStep />;
					default:
						return null;
				}
			})()}
		</div>
	);
}

export default memo(Appointment);
