import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import cn from 'classnames';

import { useSelector, useDispatch } from 'react-redux';
import { cancelDialogAction, setLoadingDialogAction } from '../../store/actions/dialog';

import { Button, Input } from '../../components';

import defaultErrorCallback from '../../utils/helpers/defaultErrorCallback';
import { profileSelector } from '../../store/selectors/profileSelectors';
import { changeEmailFormId } from '.';
import { getProfileThunk } from '../../store/actions/profile';

import { ECustomButtonTypes } from '../../enums/button-types.enum';
import { signInApi } from '../../api';

const fieldNameEmail = 'fieldNameChangeEmail';

export function EmailInput() {
	const dispatch = useDispatch();
	const { register, handleSubmit, errors, setValue } = useForm();
	const profile = useSelector(profileSelector);

	const [isEditEmail, setIsEditEmail] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	function onClickDeclineEditEmail() {
		setIsEditEmail(false);
		setValue(fieldNameEmail, profile?.email);
	}

	const onOk = async (data: any) => {
		const emailValue = data[fieldNameEmail];

		try {
			// post request for change email data
			setIsLoading(true);
			await signInApi.patchProfile({ email: emailValue });
			await dispatch(getProfileThunk());
		} catch (error) {
			dispatch(cancelDialogAction());
			defaultErrorCallback({
				errorMessage: 'Произошла неизвестная ошибка. Пожалуйста, обратитесь в клинику по телефону.',
			});
			onClickDeclineEditEmail();
		} finally {
			dispatch(setLoadingDialogAction(false));
			setIsEditEmail(false);
			setIsLoading(false);
		}
	};
	const onSubmit = handleSubmit(onOk);

	const defaultValue = (() => {
		if (isEditEmail) {
			return profile?.email ? profile.email : '';
		} else return profile?.email ? profile.email : 'Не указан';
	})();

	return (
		<div className="input-wrap">
			<form
				onSubmit={onSubmit}
				id={changeEmailFormId}
				className={cn('profile-email-form', { editing: isEditEmail })}
			>
				<div className="link-change">
					<Button onClick={() => setIsEditEmail(true)} buttontype={ECustomButtonTypes.link}>
						Изменить адрес
					</Button>
				</div>
				<div className={cn('input-label', { editing: isEditEmail })}>Email</div>
				<div className="input-value input-value-email">
					<Input
						key={defaultValue}
						className={cn({ editing: isEditEmail })}
						register={register}
						fieldName={fieldNameEmail}
						placeholder="Email"
						type="email"
						required
						errors={errors?.[fieldNameEmail]}
						defaultValue={defaultValue}
						validateMessage="Неправильный Email"
						readOnly={!isEditEmail}
					/>
				</div>
				{isEditEmail && (
					<div className="email-editor">
						<Button onClick={onClickDeclineEditEmail} buttontype={ECustomButtonTypes.borderBlue}>
							Отменить
						</Button>
						<Button type="submit" loading={isLoading}>
							Сохранить
						</Button>
					</div>
				)}
				<div className={'email-message'}>
					<div className="profile-note">
						Электронная почта нужна для&nbsp;того, чтобы мы могли отправлять вам результаты анализов
						или&nbsp;чеки об&nbsp;оказанных услугах
					</div>
				</div>
			</form>
		</div>
	);
}
