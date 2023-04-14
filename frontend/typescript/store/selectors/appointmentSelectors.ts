import { createSelector } from 'reselect';
import getDoctorBranch from '../../utils/helpers/getDoctorBranch';
import { RootState } from '../rootReducer';

const state = ({ appointment }: RootState) => appointment;
const slotsState = ({ appointment }: RootState) => appointment.slots;

export const appointmentSelector = createSelector(state, (appointment) => appointment);
export const currentStepSelector = createSelector(state, ({ currentStep }) => currentStep);
export const isFastAppointmentSelector = createSelector(state, ({ isFastAppointment }) => isFastAppointment);
export const stepsHistorySelector = createSelector(state, ({ stepsHistory }) => stepsHistory);
export const smsDelaySelector = createSelector(state, ({ smsDelay }) => smsDelay);
export const serverErrorSelector = createSelector(
	state,
	({ serverErrorCreateAppointment }) => serverErrorCreateAppointment,
);
export const valuesCreateAppointmentSelector = createSelector(
	state,
	({ valuesCreateAppointment }) => valuesCreateAppointment,
);
export const medicineDirectionsSelector = createSelector(state, ({ medicineDirections }) => medicineDirections);
export const doctorsSelector = createSelector(state, ({ doctors }) => doctors);

export const currentDoctorSelector = createSelector(state, ({ doctors, valuesCreateAppointment }) => {
	if (doctors && valuesCreateAppointment.doctorId) {
		return (
			doctors.find((doc) => {
				return String(doc.id) === String(valuesCreateAppointment.doctorId);
			}) || null
		);
	}
	return null;
});

export const currentBranchSelector = createSelector(state, ({ medicineDirections, valuesCreateAppointment }) => {
	if (medicineDirections && valuesCreateAppointment.doctorId) {
		medicineDirections.find((branch) => {
			return String(branch.branch.id) === String(valuesCreateAppointment.currentBranch);
		});
	}
	return null;
});

export const appointmentTypeOptionsSelector = createSelector(state, ({ doctors, valuesCreateAppointment }) => {
	const { doctorId, currentBranch: branchId } = valuesCreateAppointment;
	if (doctors?.length && doctorId && branchId) {
		const foundDoctor = doctors.find((doc) => {
			return valuesCreateAppointment.doctorId === String(doc.id);
		});
		const foundBranch = foundDoctor?.branches.find((branch) => {
			return valuesCreateAppointment.currentBranch === String(branch.branch.id);
		});
		const options = foundBranch?.visit_types.map((type) => {
			return {
				name: type,
				value: type,
				price: foundBranch.appointment_price,
			};
		});
		return options || null;
	} else {
		return null;
	}
});

export const scheduleSelector = createSelector(slotsState, (slots) => {
	if (!slots) return null;
	const normalizedSchedule = slots?.map((i) => {
		const date = new Date(i.start_time);

		const day = new Intl.DateTimeFormat('ru', {
			timeZone: 'Europe/Moscow',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
		}).format(date);

		return {
			day,
			...i,
		};
	});

	const now = Date.now();
	const oneDayMilliseconds = 1000 * 60 * 60 * 24;
	const daysThreeWeeks = new Array(29).fill(true).map((_, index) => {
		const date = new Date(now + oneDayMilliseconds * index);
		return new Intl.DateTimeFormat('ru', {
			timeZone: 'Europe/Moscow',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
		}).format(date);
	});
	return daysThreeWeeks.map((ud) => {
		const daysScheduleFiltered = normalizedSchedule?.filter((ns) => ns.day === ud);
		return {
			day: ud,
			slots: daysScheduleFiltered,
		};
	});
});

export const slotsSelector = createSelector(state, ({ slots }) => slots);

export const appointmentDataSelector = createSelector(state, ({ appointmentData }) => appointmentData);

export const isRedirectSelector = createSelector(state, ({ isRedirect }) => isRedirect);

const appointmentSelectorVisit = createSelector(
	valuesCreateAppointmentSelector,
	doctorsSelector,
	appointmentDataSelector,
	(fieldValues, doctors, appointmentData) => ({
		fieldValues,
		doctors,
		appointmentData,
	}),
);

/* TODO: visitInfoSelector == DeadCode вырезать при случае 24.01.2022 */
export const visitInfoSelector = createSelector(
	appointmentSelectorVisit,
	({ fieldValues, doctors, appointmentData }) => {
		const doctor = doctors.find((d) => `${d.id}` === fieldValues.doctorId);
		const doctorBranch = getDoctorBranch({ doctor, directionMedicineId: fieldValues.currentBranch });

		const date = (() => {
			if (fieldValues.timeSlot) {
				const dateInstance = new Date(fieldValues.timeSlot || '');
				try {
					return new Intl.DateTimeFormat('ru', {
						timeZone: 'Europe/Moscow',
						weekday: 'long',
						day: 'numeric',
						month: 'numeric',
						year: 'numeric',
					}).format(dateInstance);
				} catch (error) {
					return '';
				}
			}
			if (appointmentData?.start_time) {
				const dateInstance = new Date(appointmentData?.start_time || '');
				try {
					return new Intl.DateTimeFormat('ru', {
						timeZone: 'Europe/Moscow',
						weekday: 'long',
						day: 'numeric',
						month: 'numeric',
						year: 'numeric',
					}).format(dateInstance);
				} catch (error) {
					return '';
				}
			}

			return '';
		})();

		const time = (() => {

			try {
				const dateInstance = new Date(fieldValues.timeSlot || appointmentData?.start_time || '');

				return new Intl.DateTimeFormat('ru', {
					timeZone: 'Europe/Moscow',
					minute: 'numeric',
					hour: 'numeric',
				}).format(dateInstance);
			} catch (error) {
				return '';
			}
		})();

		const mappingAppointmentType: { [key: string]: string } = {
			offline: 'offline',
			online: 'online',
		};

		return {
			image2: doctor?.image2 || appointmentData?.doctor?.image2,
			firstName: doctor?.first_name || appointmentData?.doctor?.first_name,
			lastName: doctor?.last_name || appointmentData?.doctor?.last_name,
			patronymic: doctor?.patronymic || appointmentData?.doctor?.patronymic,
			specialty: doctor?.specialty || appointmentData?.doctor?.specialty,
			online_appointment_available: doctor?.online_appointment_available,
			qualification: doctor?.qualification_category || appointmentData?.doctor?.qualification_category,
			cost: appointmentData?.amount || doctorBranch?.appointment_price,
			doctorBranch,
			date,
			time,
			type: mappingAppointmentType[(fieldValues.appointmentType as string) || (appointmentData?.type as string)],
			appointmentType: fieldValues.appointmentType,
			address: appointmentData?.clinic?.address_display,
			timeSlot: fieldValues.timeSlot,
		};
	},
);

export const eventAddCalendarSelector = createSelector(appointmentDataSelector, (appointment) => {
	if (!appointment) return null;
	const { doctor, type, clinic, start_time } = appointment;

	const fullNameDoctor = [doctor.last_name, doctor.first_name, doctor.patronymic]
		.filter((val) => !!val)
		.join(' ')
		.trim();
	const endTime =
		start_time && Date.parse(start_time) ? new Date(new Date(start_time).getTime() + 1800000) : undefined;

	return {
		title: 'title',
		description: `description`,
		startTime: start_time || undefined,
		endTime,
	};
});

export const optionsMedicineDirectionsSelector = createSelector(medicineDirectionsSelector, (medicineDirections) => {
	return medicineDirections.map((direction) => ({
		value: `${direction.branch.id}`,
		label: direction.branch.name,
		name: direction.branch.name,
	}));
});

export const currentDirectionNameSelector = createSelector(
	medicineDirectionsSelector,
	valuesCreateAppointmentSelector,
	(medicineDirections, { currentBranch }) => {
		return medicineDirections?.find((d) => d.branch.id === Number(currentBranch))?.branch?.name;
	},
);
