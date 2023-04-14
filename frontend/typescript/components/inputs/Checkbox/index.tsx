import React, { ReactNode, memo } from 'react';
import cn from 'classnames';
import './Checkbox.scss';

export interface IOption {
	value: string;
	name: string;
	label: string | ReactNode;
	disabled?: boolean;
}

export interface IChangeValue {
	value: string;
	checked: boolean;
	item: IOption;
}

interface IProps {
	register?: any;
	errors?: any;
	className?: string;
	classNameItem?: string;
	fieldName: string;
	required?: boolean;
	type?: 'radio' | 'checkbox';
	visibleType?: 'special' | 'default' | 'button' | 'square';
	defaultValue?: IOption;
	options: IOption[];
	visibleRequiredLabel?: boolean;
	labelText?: string | ReactNode;
	requiredMessage?: string;
	validateMessage?: string;
	onChange?: ({ value, checked, item }: IChangeValue) => void;
	scrollIntoView?: boolean;
}

const Checkbox = ({
	register,
	defaultValue,
	className,
	classNameItem,
	fieldName,
	required,
	errors,
	type = 'checkbox',
	options,
	visibleType = 'default',
	visibleRequiredLabel,
	labelText,
	requiredMessage,
	validateMessage,
	onChange,
	scrollIntoView,
}: IProps) => {
	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={cn(
				// 'form__section',
				`checkbox checkbox-name__${fieldName} checkbox-visible-type__${visibleType}`,
				fieldName,
				className,
				{ error: !!errors },
			)}
		>
			{labelText && (
				<label htmlFor={fieldName}>
					{labelText}
					{required && visibleRequiredLabel && <span className="yellow">*</span>}
				</label>
			)}
			<div className="checkbox__options">
				{options.map((item) => {

					const { name, value, label, disabled } = item;
					return (
						<div
							className={cn('form__group-row', classNameItem, disabled)}
							key={value}
							role="button"
							tabIndex={0}
						>
							<input
								id={name}
								className="select-horizontal__input"
								name={fieldName}
								type={type}
								value={value}
								onChange={(event) => {
									event.currentTarget?.parentElement?.scrollIntoView({
										behavior: 'smooth',
										block: 'nearest',
										inline: 'nearest',
									});
									onChange?.({ value: event.target.value, checked: event.target.checked, item });
								}}
								defaultChecked={defaultValue?.value === value}
								ref={(register || (() => {}))({ required })}
								disabled={disabled}
							/>
							<label className="select-horizontal__label" htmlFor={name}>
								{label}
							</label>
						</div>
					);
				})}
			</div>
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

export default memo(Checkbox);
