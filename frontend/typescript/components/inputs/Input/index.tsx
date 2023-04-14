import { memo, useState, useEffect } from 'react';
import cn from 'classnames';
import './Input.scss';

interface IInput {
	register?: any;
	errors?: any;
	className?: string;
	fieldName: string;
	required?: boolean;
	placeholder?: string;
	type?: 'text' | 'email';
	labelText?: string;
	defaultValue?: string;
	validateMessage?: string;
	requiredMessage?: string;
	// visibleValidLabel?: boolean;
	visibleRequiredLabel?: boolean;
	onValidate?: (value: string) => void;
	validateConf?: any;
	visibleValidPrefix?: boolean;
	readOnly?: boolean;
}

const validateHandler = (type: string) => (value: string) => {
	if (type === 'email') return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.([a-zA-Z0-9-.]{2,15})+$/.test(value);
	return true;
}

const Input = ({
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
	readOnly,
}: IInput) => {
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
		<div className={cn('form__section', fieldName, className, { error: !!errors, valid: isValid })}>
			<input
				className={cn('field', fieldName, { error: !!errors, valid: isValid })}
				defaultValue={defaultValue}
				name={fieldName}
				id={fieldName}
				placeholder={placeholder}
				onChange={onForceUpdate}
				ref={
					register
						? register({
								required,
								validate: onValidate || validateHandler(type),
								...validateConf,
						  })
						: undefined
				}
				readOnly={readOnly}
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

export default memo(Input);
