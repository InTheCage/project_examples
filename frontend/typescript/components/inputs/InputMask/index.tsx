import { memo, useState, useEffect, ChangeEvent } from 'react';
import ReactInputMask from 'react-input-mask';
import cn from 'classnames';

import './InputMask.scss';

interface IInputMask {
	register?: any;
	errors?: any;
	className?: string;
	fieldName: string;
	required?: boolean;
	type?: 'text' | 'email' | 'sms';
	labelText?: string;
	validateMessage?: string;
	requiredMessage?: string;
	visibleRequiredLabel?: boolean;
	visibleValidPrefix?: boolean;
	mask?: string;
	placeholder?: string;
	defaultValue?: string;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
	validateHandler?: (value: string) => boolean;
	validateConf?: any;
	maskChar?: string | null;
}

// const validateHandler = (type: string) => (value: string) => {
// 	if (type === 'email') return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.([a-zA-Z0-9-.]{2,15})+$/.test(value);
// 	return true;
// };

const InputMask = ({
	register,
	className,
	fieldName,
	required,
	errors,
	labelText,
	validateMessage,
	requiredMessage,
	visibleRequiredLabel = true,
	visibleValidPrefix,
	mask,
	placeholder,
	onChange,
	defaultValue,
	validateHandler,
	validateConf,
	maskChar,
}: IInputMask) => {
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
				<ReactInputMask
					inputRef={register?.({ required, ...validateConf })}
					mask={mask || '+7 (999) 999-99-99'}
					autoComplete="off"
					name={fieldName}
					id={fieldName}
					placeholder={placeholder || 'Ваш номер телефона'}
					onChange={onChange}
					defaultValue={defaultValue}
					// @ts-ignore
					maskChar={maskChar}
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
		</div>
	);
};

export default memo(InputMask);
