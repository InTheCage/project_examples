import React, { ReactNode, useState, useEffect, useRef } from 'react';

import debouce from 'lodash.debounce';

import Button from '../../Button';
import Checkbox from '../../inputs/Checkbox';

import { getIsScrolledIntoView } from '../../../utils/helpers';

import { ECustomButtonTypes } from '../../../enums/button-types.enum';
import './DaysCalendar.scss';

export interface IOption {
	value: string;
	name: string;
	label: string | ReactNode;
}

interface IProps {
	days: IOption[];
	fieldName: string;
	register?: any;
	onChange?: (value: IOption) => void;
	defaultValue?: IOption;
}

const dayClass = 'days-calendar__day';
const daysContentClass = 'days-calendar__content';

function DaysCalendar({ days, register, fieldName, onChange, defaultValue }: IProps) {
	const defaultDay = defaultValue || days[0];
	const [currentValue, setCurrentValue] = useState<IOption>(defaultDay);
	const [disabledLeftButton, setDisabledLeftButton] = useState(false);
	const [disabledRightButton, setDisabledRightButton] = useState(false);
	const daysContentRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		handleDisablingButtons();
		const handleResize = () => debounceHandleDisablingButtons();
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);
	/* TODO: проверить как будет работать без этого 10.12.2021 */
	// useEffect(() => {
	// window.addEventListener('resize', handleResize);
	// return () => {
	// 	window.removeEventListener('resize', handleResize);
	// };
	// }, [handleDisablingButtons]);

	useEffect(() => {
		if (daysContentRef.current) {
			const foundInp = daysContentRef.current?.querySelector('input[checked]');
			foundInp?.parentElement?.scrollIntoView();
		}
	}, [defaultDay]);

	function handleDisablingButtons(_dayElements?: Element[]) {
		const parentElement = document.querySelector(`#${daysContentClass}`) as Element;
		const dayElements = _dayElements || Array.from(window.document.querySelectorAll(`.${dayClass}`));
		const [first, ...rest] = dayElements;
		const [last, ..._rest] = dayElements.reverse();
		const isVisibleFirstItem = first && getIsScrolledIntoView(first, parentElement);
		const isVisibleLastItem = last && getIsScrolledIntoView(last, parentElement);
		setDisabledLeftButton(isVisibleFirstItem);
		setDisabledRightButton(isVisibleLastItem);
	}

	function handleClickLeft() {
		let isFoundFistVisibleDay: null | boolean = null;
		const dayElements = Array.from(window.document.querySelectorAll(`.${dayClass}`));
		dayElements.reverse().some((element) => {
			const isVisible = getIsScrolledIntoView(element);
			switch (true) {
				case isVisible && isFoundFistVisibleDay === null: {
					isFoundFistVisibleDay = true;
					return false;
				}
				case isFoundFistVisibleDay === true && isVisible === false: {
					element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
					return true;
				}
				default:
					return false;
			}
		});
		handleDisablingButtons(dayElements.reverse());
	}

	function handleClickRight() {
		let isFoundFistVisibleDay: null | boolean = null;
		const dayElements = Array.from(window.document.querySelectorAll(`.${dayClass}`));
		dayElements.some((element) => {
			const isVisible = getIsScrolledIntoView(element);
			switch (true) {
				case isVisible && isFoundFistVisibleDay === null: {
					isFoundFistVisibleDay = true;
					return false;
				}
				case isFoundFistVisibleDay === true && isVisible === false: {
					element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
					return true;
				}
				default:
					return false;
			}
		});
		handleDisablingButtons(dayElements);
	}

	const debounceHandleDisablingButtons = debouce(handleDisablingButtons, 100);

	function handleScrollDays() {
		debounceHandleDisablingButtons();
	}

	return (
		<div className="days-calendar">
			<Button
				className="days-calendar__button left"
				buttontype={ECustomButtonTypes.default}
				onClick={handleClickLeft}
				disabled={disabledLeftButton}
			>
				{'<'}
			</Button>
			<div className={daysContentClass} id={daysContentClass} ref={daysContentRef} onScroll={handleScrollDays}>
				<Checkbox
					classNameItem={dayClass}
					options={days}
					fieldName={fieldName}
					register={register || (() => {})}
					type="radio"
					visibleType="button"
					defaultValue={defaultDay}
					onChange={(currentDay) => {
						onChange && onChange(currentDay.item);
						setCurrentValue(currentDay.item);
					}}
					scrollIntoView
				/>
			</div>
			<Button
				className="days-calendar__button right"
				buttontype={ECustomButtonTypes.default}
				onClick={handleClickRight}
				disabled={disabledRightButton}
			>
				{'>'}
			</Button>
		</div>
	);
}

export default DaysCalendar;
