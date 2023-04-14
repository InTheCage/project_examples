import React, { memo, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { scheduleSelector, valuesCreateAppointmentSelector } from '../../store/selectors/appointmentSelectors';
import { setValuesCreateAppointmentAction } from '../../store/actions/appointment';

import Checkbox, { IChangeValue } from '../inputs/Checkbox';
import { dateFormatter } from '../../utils/helpers/dateFormatter';

import DaysCalendar, { IOption } from './DaysCalendar';
import { TSchedule, TValuesCreateAppointment, TVisitTypes } from '../../interfaces/appointment';
import './AppointmentCalendar.scss';
import { getQueryToObject } from '../../utils/helpers';

const fieldNameCalendar = 'fieldNameCalendar';
const fieldNameSelectDay = 'fieldNameSelectDay';
const fieldNameSelectTime = 'fieldNameSelectTime';

const getNewSlotsOptions = ({
	selectedDay,
	schedule,
	appointmentType,
}: {
	selectedDay: string;
	schedule: TSchedule[];
	appointmentType: TVisitTypes;
}): IOption[] | undefined => {
	const slotsByDay = schedule?.find((day) => day.day === selectedDay)?.slots.map((sl) => ({ ...sl })) || null;

	return slotsByDay
		?.filter((sl) => {
			switch (true) {
				case appointmentType === 'at_clinic':
					return sl.offline;
				case appointmentType === 'online':
					return sl.online;
				default:
					return false;
			}
		})
		.map((slot) => {
			const label = dateFormatter(slot.start_time, { isTime: true });

			return {
				label,
				value: slot.start_time,
				name: slot.start_time,
			};
		});
};

function AppointmentCalendar() {
	const location = useLocation();
	const dispatch = useDispatch();
	const { dateSchedule, appointmentType, doctorId } = useSelector(valuesCreateAppointmentSelector);
	const schedule = useSelector(scheduleSelector);
	const [selectedDay, setSelectedDay] = useState('');
	// WARNING:
	// Используй defaultDay defaultSlot, только с query параметрами и ни как иначе,
	// если это понадобится перепродумай логику всех шагов /Appointment
	// которая использует query параметры она инкапсулирована, вся заключена в if(location.search) 24.12.2021
	const [defaultDay, setDefaultDay] = useState<IOption | undefined>(undefined);
	const [defaultSlot, setDefaultSlot] = useState<IOption | undefined>(undefined);
	const [slotsOptions, setSlotsOptions] = useState<IOption[] | undefined>(undefined);

	function handleClickTimeSlot(value: IChangeValue) {
		dispatch(setValuesCreateAppointmentAction({ timeSlot: value.item.value }));
	}

	function handleChangeDay(day: IOption) {
		setSelectedDay(day.value);
	}

	useEffect(() => {
		function handle() {
			if (schedule) {
				if (location.search) {
					const queries = getQueryToObject(location.search);
					if (queries.timeSlot && queries.timeSlot !== 'soon') {
						const date = dateFormatter(
							new Date(queries.timeSlot),
							{},
							{ month: 'numeric', year: 'numeric', day: 'numeric' },
						);
						setDefaultDay({
							value: `${date}`,
							label: '',
							name: '',
						});
					} else if (queries.timeSlot === 'soon') {
						setDefaultDay({
							value: `${queries.day}`,
							label: '',
							name: '',
						});
					}
				} else {
					setDefaultDay({ value: schedule[0].day, label: '', name: '' });
					const newSlotsOptions = getNewSlotsOptions({
						selectedDay: schedule[0].day,
						schedule,
						appointmentType: 'at_clinic',
					});
					setSlotsOptions(newSlotsOptions);
				}
			}
		}
		handle();
	}, [schedule]);

	useEffect(() => {
		function handle() {
			if (defaultDay) {
				setSelectedDay(defaultDay.value);
				if (location.search) {
					const queries: TValuesCreateAppointment = getQueryToObject(location.search);
					if (queries.timeSlot && queries.timeSlot !== 'soon') {
						const foundSlot = slotsOptions?.find((option) => option.value === queries.timeSlot);
						foundSlot && setDefaultSlot(foundSlot);
					}
				}
			}
		}
		handle();
	}, [defaultDay]);

	useEffect(() => {
		function handle() {
			if (defaultSlot) {
				if (location.search) {
					const queries: TValuesCreateAppointment = getQueryToObject(location.search);
					if (queries.timeSlot) {
						dispatch(setValuesCreateAppointmentAction({ timeSlot: queries.timeSlot }));
					}
				}
			}
		}
		handle();
	}, [defaultSlot?.value]);

	useEffect(() => {
		function handle() {
			if (selectedDay && schedule && appointmentType) {
				const newSlotsOptions = getNewSlotsOptions({ selectedDay, schedule, appointmentType });
				setSlotsOptions(newSlotsOptions);
			}
		}
		handle();
	}, [selectedDay, schedule, appointmentType]);

	const dayOptions = useMemo(() => {
		return schedule?.map((item) => {
			const dateInstance = new Date(item.day.split('.').reverse().join('-'));
			const dateString = dateFormatter(
				dateInstance,
				{},
				{ timeZone: 'Europe/Moscow', weekday: 'long', day: 'numeric' },
			);

			const timeOptions = item.slots
				?.filter((slot) => slot[appointmentType === 'at_clinic' ? 'offline' : 'online'])
				?.map?.((slot) => {
					const dateInstance = new Date(slot.start_time);

					const time = dateFormatter(
						dateInstance,
						{},
						{
							timeZone: 'Europe/Moscow',
							minute: 'numeric',
							hour: 'numeric',
						},
					);
					return {
						value: slot.start_time,
						name: `${slot.start_time}-${doctorId}-${item.day}`,
						label: time,
					};
				});
			return {
				value: item.day,
				label: dateString,
				name: `${dateString}-doctor-calendar-day-${doctorId}-${item.day}`,
				timeOptions,
			};
		});
	}, [schedule, appointmentType, dateSchedule]);

	return (
		<div className="appointment-calendar">
			{!!dayOptions && (
				<DaysCalendar
					key={defaultDay?.value}
					days={dayOptions}
					fieldName={fieldNameSelectDay}
					onChange={handleChangeDay}
					defaultValue={defaultDay}
				/>
			)}
			{(() => {

				switch (true) {
					case !slotsOptions:
						return '';
					case slotsOptions && !!slotsOptions?.length:
						return (
							<Checkbox
								key={defaultSlot?.value}
								className="checkbox-time-calendar"
								// @ts-ignore
								options={slotsOptions}
								fieldName={fieldNameSelectTime}
								type="radio"
								visibleType="button"
								onChange={(item) => {
									const [soon] = item.value?.split?.('_-_') || [];
									const newValue = soon.trim() === 'soon' ? 'soon' : item.value;
									const newItem = {
										...item,
										item: { ...item.item, value: newValue },
										value: newValue,
									};
									handleClickTimeSlot(newItem);
								}}
								defaultValue={defaultSlot}
							/>
						);
					// @ts-ignore
					case slotsOptions && slotsOptions?.length === 0:
						return (
							<div className="appointment-calendar__no-appointment">
								<div className="subtitle1">На этот день у специалиста полная запись</div>
								<p>Выберите другую дату или запишитесь на ближайшее освободившееся время</p>
								<Checkbox
									className="checkbox-time-calendar"
									options={[
										{
											value: `soon_-_${selectedDay}`,
											name: `soon-${doctorId}-${selectedDay}`,
											label: 'на ближайшее освободившееся время',
										},
									]}

									fieldName={`${fieldNameCalendar}-time-${doctorId}`}
									type="radio"
									visibleType="button"
									onChange={(item) => {
										const [soon] = item.value?.split?.('_-_') || [];
										const newValue = soon.trim() === 'soon' ? 'soon' : item.value;
										const newItem = {
											...item,
											item: { ...item.item, value: newValue },
											value: newValue,
										};
										handleClickTimeSlot(newItem);
									}}
								/>
							</div>
						);
					default:
						return '';
				}
			})()}
		</div>
	);
}

export default memo(AppointmentCalendar);
