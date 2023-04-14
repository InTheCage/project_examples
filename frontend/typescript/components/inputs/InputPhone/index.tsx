import React, { memo, useState, useEffect, ChangeEvent, ReactNode } from 'react';
import localeRu from 'react-phone-input-2/lang/ru.json';
import PhoneInput from 'react-phone-input-2';
import { Controller } from 'react-hook-form';
import { Control } from 'react-hook-form/dist/types/form';
import cn from 'classnames';

import 'react-phone-input-2/lib/style.css';
import './InputPhone.scss';

export type TInputPhoneValue = {
	value: string;
	data: {
		name: string;
		dialCode: string;
		countryCode: string;
		format: string;
	};
	formattedValue: string;
};

interface IInputPhone {
	control?: Control<any>;
	errors?: any;
	className?: string;
	fieldName: string;
	required?: boolean;
	labelText?: string;
	validateMessage?: string;
	requiredMessage?: string;
	visibleRequiredLabel?: boolean;
	visibleValidPrefix?: boolean;
	placeholder?: string;
	defaultValue?: string;
	onChange?: ({ value, data, formattedValue }: TInputPhoneValue) => void;
	customErrorMessage?: ReactNode;
}

const InputPhone = ({
	className,
	fieldName,
	required,
	errors,
	labelText,
	validateMessage,
	requiredMessage,
	visibleRequiredLabel = true,
	visibleValidPrefix,
	placeholder,
	onChange: handleChange,
	defaultValue,
	control,
	customErrorMessage,
}: IInputPhone) => {
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const [isFirstRender, setIsFirstRender] = useState<boolean | null>(true);
	const [forceUpdateValue, forceUpdate] = useState(Math.random());

	useEffect(() => {
		if (errors) {
			setIsValid(false);
		} else if (!errors && isFirstRender === false) {
			setIsValid(true);
		}
		if (isFirstRender) setIsFirstRender(false);
	}, [errors, forceUpdateValue]);

	const onForceUpdate = () => {
		if (visibleValidPrefix) forceUpdate(Math.random());
	};

	return (
		<div className={cn(fieldName, className, { error: !!errors, valid: isValid })}>
			<div className="form__section">
				{labelText && (
					<label htmlFor={fieldName}>
						{labelText}
						{required && visibleRequiredLabel && <span className="yellow">*</span>}
					</label>
				)}
				{control && (
					<Controller
						control={control}
						name={fieldName}
						defaultValue={defaultValue}
						id={fieldName}
						// value={defaultValue}
						render={(props: any) => {
							const { field, onChange } = props;
							return (
								<PhoneInput
									country="ru"
									localization={localeRu}
									{...field}
									id={fieldName}
									value={defaultValue}
									name={fieldName}
									onChange={(
										value: string,
										data: TInputPhoneValue['data'],
										event: any,
										formattedValue: string,
									) => {
										if (control) {
											onChange?.({ formattedValue, value, data });
										} else {
											handleChange?.({ value, data, formattedValue });
										}
									}}
									placeholder={placeholder || 'Ваш номер телефона'}
								/>
							);
						}}
					/>
				)}
				{!control && (
					<PhoneInput
						country="ru"
						localization={localeRu}
						onChange={(
							value: string,
							data: TInputPhoneValue['data'],
							event: any,
							formattedValue: string,
						) => {
							handleChange?.({ value, data, formattedValue });
						}}
						placeholder={placeholder || 'Ваш номер телефона'}
					/>
				)}
				{errors && (
					<div className="input__errors">
						{(() => {
							if (errors?.type === 'required') {
								return (
									<span className="error-message">
										{requiredMessage || errors.message || 'Обязательное поле'}
									</span>
								);
							} else if (errors?.type === 'validate') {
								return (
									<span className="error-message">
										{validateMessage || errors.message || 'Incorrect value'}
									</span>
								);
							} else if (errors?.type === 'pattern') {
								return <span className="error-message">{errors.message}</span>;
							} else return null;
						})()}
					</div>
				)}
				{customErrorMessage}
			</div>
		</div>
	);
};

export default memo(InputPhone);
