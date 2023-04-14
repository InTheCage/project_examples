/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { SyntheticEvent, memo, useState } from 'react';
import ReactDatepicker, { registerLocale } from 'react-datepicker';
import cn from 'classnames';

import ru from 'date-fns/locale/ru';

import CalendarIconSvg from '../../static/images/icons/calendar.svg';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.scss';
import { Button } from '../index';
import { ECustomButtonTypes } from '../../enums/button-types.enum';

registerLocale('ru', ru);

export type TValues = Date | [Date | null, Date | null] | null;

interface IDatePicker {
	selected?: Date | null;
	startDate?: Date | null;
	endDate?: Date | null;
	onChange?: (date: TValues, event?: SyntheticEvent<any, Event> | undefined) => void;
	className?: string;
	wrapperClass?: string;
	reference?: React.MutableRefObject<any>;
	dateFormat?: string;
	showTimeSelect?: boolean;
	type?: 'input' | 'button';
	required?: boolean;
	placeholderText?: string;
	selectsRange?: boolean;
	container?: (props: { children: React.ReactNode[] }) => React.ReactNode;
	onApply?: (date: TValues) => void;
}

const DatePicker = ({
	onChange,
	selected,
	className,
	wrapperClass,
	dateFormat,
	showTimeSelect,
	type = 'input',
	reference,
	required,
	placeholderText,
	selectsRange,
	startDate: defaultsStartDate = null,
	endDate: defaultEndDate = null,
	container,
	onApply,
}: IDatePicker) => {
	const [startDate, setStartDate] = useState<null | Date>(defaultsStartDate);
	const [endDate, setEndDate] = useState<null | Date>(defaultEndDate);
	const [renderKey, forceRender] = useState(1);

	const pickerClasses = cn({ 'date-picker': true }, className);
	const wrapClass = cn({ 'date-picker-wrapper': true }, wrapperClass);

	function handleChange(values: TValues) {
		if (!Array.isArray(values)) {
			console.log('Date is`t an array');
			return;
		}
		const [start, end] = values;
		setStartDate(start);
		setEndDate(end);
		onChange && onChange(values);
	}

	const applyContainer = onApply
		? (props: any) => {
				const { children } = props;
				return (
					<div {...props}>
						{children}
						<div className="date-picker__apply-wrap">
							{(startDate || endDate) && (
								<Button
									buttontype={ECustomButtonTypes.borderBlue}
									onClick={() => {
										handleChange([null, null]);
										// onApply([null, null]);
									}}
								>
									Очистить календарь
								</Button>
							)}
							<Button
								onClick={() => {
									onApply([startDate || null, endDate || null]);
									forceRender(Math.random());
								}}
							>
								Выбрать
							</Button>
						</div>
					</div>
				);
		  }
		: undefined;

	return (
		<div className={wrapClass}>
			<label>
				<ReactDatepicker
					key={renderKey}
					startDate={startDate}
					endDate={endDate}
					dateFormat={dateFormat}
					selected={selected}
					onChange={handleChange}
					placeholderText={placeholderText}
					locale={ru}
					popperClassName={'custom-popper'}
					className={pickerClasses}
					showTimeSelect={showTimeSelect}
					ref={reference}
					strictParsing
					required={required}
					selectsRange={selectsRange}
					closeOnScroll
					calendarContainer={container || applyContainer}
				/>
				{type === 'input' && (
					<div className="calendar-icon">
						<img src={CalendarIconSvg} alt="" />
					</div>
				)}
				{required && <span className="required-star">*</span>}
			</label>
		</div>
	);
};

export default memo(DatePicker);
