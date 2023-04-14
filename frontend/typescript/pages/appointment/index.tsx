import React, { lazy, memo, Suspense, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { currentStepSelector } from '../../store/selectors/appointmentSelectors';
import { setAppointmentDataAction, setIsFastAppointmentAction } from '../../store/actions/appointment';
import { AppointmentLayout } from '../../layouts';
import Appointment from './Appointment';
import FallbackSuspense from '../../components/FallbackSuspense';
import { EAppointmentSteps } from '../../enums/appointmentSteps.enum';

import '../../styles/App.scss';

export default memo(function AppointmentPage() {
	const dispatch = useDispatch();

	const currentStep = useSelector(currentStepSelector);
	const stepsAvailableTabs = [
		EAppointmentSteps.wardSelectionStep,
		EAppointmentSteps.medicineSelectionStep,
		EAppointmentSteps.doctorSelectionStep,
		EAppointmentSteps.timeSelectionStep,
		EAppointmentSteps.timeDoctorSelectionStepTabDoctor,
		EAppointmentSteps.timeDoctorSelectionStepTabTime,
	];
	const FastAppointment = lazy(() => import('./FastAppointment'));

	useEffect(() => {
		return () => {
			dispatch(setIsFastAppointmentAction(false));
		};
	}, []);

	useEffect(() => {
		// Смотри компонент Confirm от обнуления зависит проверка в useEffect(), if (isAuth && !appointmentData) 02.02.2022
		if (stepsAvailableTabs.some((step) => currentStep === step)) {
			dispatch(setAppointmentDataAction(null));
		}
	}, [currentStep]);

	return (
		<AppointmentLayout>
			<Tabs
				defaultIndex={0}
				onSelect={(tabIndex) => {
					if (tabIndex === 1) dispatch(setIsFastAppointmentAction(true));
				}}
			>
				{stepsAvailableTabs.some((step) => {
					return step === currentStep;
				}) && (
					<TabList>
						<Tab>Запись на приём</Tab>
						<Tab>Быстрая запись</Tab>
					</TabList>
				)}
				<TabPanel>
					<Appointment />
				</TabPanel>
				<TabPanel>
					<Suspense fallback={<FallbackSuspense />}>
						<FastAppointment />
					</Suspense>
				</TabPanel>
			</Tabs>
		</AppointmentLayout>
	);
});
