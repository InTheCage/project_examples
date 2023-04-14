import React, { memo, useState, useEffect } from 'react';
import ReactSelect, { components as ReactSelectComponents } from 'react-select';
import { InputActionMeta } from 'react-select/src/types';
import cn from 'classnames';

import { formatGroupLabel } from './components';
import { getStyles } from './getStyles';
import './Select.scss';

export interface IOption {
	label: string;
	value: string;
}

export interface ISelectGroupOptions {
	label: string;
	key: string;
	options: IOption[];
}

export interface ISelect {
	register?: any;
	errors?: any;
	className?: string;
	fieldName: string;
	required?: boolean;
	placeholder?: string;
	type?: 'text' | 'email' | 'search' | 'multi';
	labelText?: string;
	defaultValue?: ISelectGroupOptions | IOption;
	value?: ISelectGroupOptions | IOption[] | null;
	validateMessage?: string;
	requiredMessage?: string;
	// visibleValidLabel?: boolean;
	visibleRequiredLabel?: boolean;
	onValidate?: (value: string) => void;
	validateConf?: any;
	visibleValidPrefix?: boolean;
	onChange?: (value: any, actionMeta: any) => void;
	options?: (ISelectGroupOptions | IOption)[];
	autoFocus?: boolean;
	onInputChange?: ((newValue: string, actionMeta: InputActionMeta) => void) | undefined;
	clearable?: boolean;
	searchable?: boolean;
	noOptionsMessage?: string;
	isMulti?: boolean;
	closeMenuOnSelect?: boolean;
	ValueContainer?: typeof ReactSelectComponents.ValueContainer;
	hideSelectedOptions?: boolean;
	components?: any;
}

const validateHandler = (type: string) => (value: string) => {
	if (type === 'email') return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.([a-zA-Z0-9-.]{2,15})+$/.test(value);
	return true;
};

const Select = ({
	register,
	defaultValue,
	className,
	fieldName,
	required,
	placeholder,
	errors,
	type = 'text',
	labelText,
	validateMessage,
	requiredMessage,
	visibleRequiredLabel = true,
	onValidate,
	validateConf,
	visibleValidPrefix,
	onChange,
	options,
	autoFocus = false,
	clearable = true,
	searchable,
	isMulti,
	noOptionsMessage,
	closeMenuOnSelect,
	ValueContainer,
	hideSelectedOptions,
	onInputChange,
	components,
	value,
}: ISelect) => {
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

	// const onForceUpdate = () => {
	// 	if (visibleValidPrefix) forceUpdate(Math.random());
	// };

	const NoOptionsMessage = (props: any) => {
		return (
			<div {...props} className="no-options-message">
				<span>{noOptionsMessage || 'Ничего не найдено'}</span>
			</div>
		);
	};

	const Menu = (props: any) => {
		const { children } = props;
		return (
			<ReactSelectComponents.Menu {...props} className={cn({ 'display-none': !options })}>
				{children}
			</ReactSelectComponents.Menu>
		);
	};

	return (
		<div className={cn(fieldName, className, { error: !!errors, valid: isValid, 'no-options': !options })}>
			<ReactSelect
				className={cn('field', fieldName, { error: !!errors, valid: isValid })}
				name={fieldName}
				id={fieldName}
				ref={
					register
						? register({
								required,
								validate: onValidate || validateHandler(type),
								...validateConf,
						  })
						: undefined
				}
				placeholder={placeholder}
				onChange={onChange}
				searchable={searchable}
				onBlurResetsInput={false}
				onSelectResetsInput={false}
				autoFocus={autoFocus}
				options={options}
				isClearable={clearable}
				simpleValue
				isMulti={isMulti}
				value={value || defaultValue}
				styles={getStyles(type)}
				formatGroupLabel={formatGroupLabel}
				onInputChange={onInputChange}
				closeMenuOnSelect={closeMenuOnSelect}
				components={
					ValueContainer
						? { ValueContainer, ...components, NoOptionsMessage, Menu }
						: { ...components, NoOptionsMessage, Menu }
				}
				hideSelectedOptions={hideSelectedOptions}
			/>

			{labelText && (
				<label htmlFor={fieldName}>
					{labelText}
					{required && visibleRequiredLabel && <span className="yellow">*</span>}
				</label>
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
		</div>
	);
};

export default memo(Select);
