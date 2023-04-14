import React, { useState, ChangeEvent, useMemo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { setIsAuthAction, setProfileAction } from '../../store/actions/profile';

import { Button, Checkbox, InputMask } from '../../components';
import InputPhone, { TInputPhoneValue } from '../../components/inputs/InputPhone';

import { signInApi } from '../../api';
import { ECustomButtonTypes } from '../../enums/button-types.enum';
import { Routes } from '../../enums/routes.enum';
import { handleCloseTab } from '../../utils/helpers';
import defaultErrorCallback from '../../utils/helpers/defaultErrorCallback';

import './Signin.scss';
import logo from '../../static/images/logo.svg';
import { getDocumentsTermOfUseThunk } from '../../store/actions/documents';
import { documentsTermsOfUseOptionsSelector } from '../../store/selectors/documentsSelectors';

const phoneField = 'phoneField';
const fieldNameConfirmAgreement = 'fieldNameConfirmAgreement-signin';
const fieldNameSmsCode = 'fieldNameSmsCode-signin';

export default function SignIn() {
	const dispatch = useDispatch();
	const history = useHistory();

	const documentsTermsOfUseOptions = useSelector(documentsTermsOfUseOptionsSelector);

	const [submittingPhone, setSubmittingPhone] = useState(false);
	const [isNotFoundUser, setIsNotFoundUser] = useState(false);
	const [phoneValue, setPhoneValue] = useState<TInputPhoneValue | null>(null);
	const [smsValue, setSmsValue] = useState<string>('');
	const [phoneSent, setPhoneSent] = useState<boolean>(false);
	const [smsSent, setSmsSent] = useState<boolean>(true);
	const [delayError, setDelayError] = useState<boolean>(false);
	const [manyInvalidCode, setManyInvalidCode] = useState<boolean>(false);
	const [invalidPhone, setInvalidPhone] = useState<boolean>(false);
	const [invalidCode, setInvalidCode] = useState<boolean>(false);
	const [agreement, setAgreement] = useState(false);
	const [delaySms, setDelaySms] = useState<number>(NaN);
	const [smsError, setSmsError] = useState(false);

	const handleChangeSms = (e: ChangeEvent<HTMLInputElement>) => {
		const normalizeValue = (e?.target?.value || '')
			.split('')
			.filter((char) => {
				return !char.match(/\s|-|\(|\)|_/gm);
			})
			.join('');
		setSmsValue(normalizeValue);
	};

	const onSubmitPhone = async () => {
		try {
			setSmsSent(true);
			setIsNotFoundUser(false);
			setManyInvalidCode(false);
			setInvalidPhone(false);
			setSubmittingPhone(true);
			const { data } = await signInApi.signIn({ phone: `+${phoneValue?.value}` || '' });
			setDelaySms(data.delay);
			setPhoneSent(true);
		} catch (error) {
			if (error?.response?.data?.error_code === 'sms_delay') {
				setDelayError(true);
				setPhoneSent(true);
			}
			if (error?.response?.data?.error_code === 'invalid') {
				setInvalidPhone(true);
			}
			if (error?.response?.data?.error_code === 'patient_not_found') {
				setIsNotFoundUser(true);
			}
			if (error?.response?.data?.errors.non_field_errors?.includes?.('User is blocking')) {
				setDelayError(true);
			}
			console.error({ error });
		} finally {
			setSubmittingPhone(false);
		}
	};

	const onSubmitSms = async () => {
		try {
			setManyInvalidCode(false);
			setInvalidCode(false);
			setSmsError(false);
			setDelayError(false);
			const { data } = await signInApi.signInConfirm({
				phone: `+${phoneValue?.value || ''}`,
				code: smsValue,
				consent: agreement,
			});
			localStorage.token = data.token;
			const { data: profileData } = await signInApi.getProfile();
			dispatch(setProfileAction(profileData));
			dispatch(setIsAuthAction(true));
			history.push(`${Routes.Home}`);
		} catch (error) {
			console.log({ error });
			setSmsError(true);
			if (error?.response?.data?.errors.code?.includes?.('Invalid code')) {
				setInvalidCode(true);
			}
			if (error?.response?.data?.errors.non_field_errors?.includes?.('User is blocking')) {
				setManyInvalidCode(true);
			}
		}
	};

	const isValidPhone = useMemo(() => {
		if (!phoneValue) return false;
		const lengthMask = phoneValue?.data?.format?.split('')?.filter((i: string) => i === '.').length;
		const isValid = lengthMask - 2 <= phoneValue?.value?.length;
		return isValid;
	}, [phoneValue]);

	useEffect(() => {
		async function handle() {
			try {
				await dispatch(getDocumentsTermOfUseThunk());
			} catch (err) {
				console.error(err);
				defaultErrorCallback({ errorMessage: 'Не удалось получить список документов' });
			}
		}
		handle();
	}, []);

	return (
		<div className="main-layout">
			<header className="header">
				<a href={`${process.env.REACT_APP_SITE}`} target="_blank" rel="noreferrer" className="logo-link">
					<img src={logo} className="logo" alt="Магеря - клиника гормонального здоровья" />
				</a>
				<div className="contacts">
					<a href="tel:+78005007717" className="tel" title="+78005007717">
						8 800 500 77 17
					</a>
					<div className="note">Звонок без оплаты</div>
				</div>
				<div className="close-button only-mobile" onClick={handleCloseTab} role={'button'} tabIndex={-1}>
					X
				</div>
			</header>
			<main className="authorization">
				<div className="close-button only-desktop" onClick={handleCloseTab} role={'button'} tabIndex={-1}>
					X
				</div>
				<div className="authorization-inner container shadow rad20">
					<div className="authorization__form">
						<div className="authorization__title">Вход в личный кабинет</div>
						<div className="authorization__messages">
							{isNotFoundUser && (
								<div className="message-error">
									<p>Вы ввели неверный номер телефона.</p>
									<p>Проверьте введенные данные или&nbsp;обратитесь к&nbsp;администратору</p>
								</div>
							)}
							{delayError && (
								<div className="message-error">
									<p>
										Вы слишком часто запрашиваете СМС-код. Воспользуйтесь предыдущим
										или&nbsp;подождите несколько минут.
									</p>
								</div>
							)}
							{manyInvalidCode && (
								<div className="message-error">
									<p>Ваш номер телефона заблокирован.</p>
									<p>Вы несколько раз ввели неправильный код или запрашиваете его слишком часто.</p>
									<p>Попробуйте позже.</p>
								</div>
							)}
							{invalidCode && (
								<div className="message-error">
									<p>Неправильный СМС-код.</p>
								</div>
							)}
						</div>

						<div className="authorization__content">
							{(() => {
								switch (phoneSent) {
									case false: {
										return (
											<div className="authorization-form">
												<div className="body1 text-center">
													Введите номер телефона, указанный вами при регистрации в клинике
												</div>
												<InputPhone
													fieldName={phoneField}
													labelText="Ваш номер телефона"
													placeholder="Ваш номер телефона"
													requiredMessage="Пожалуйста, укажите номер телефона"
													onChange={setPhoneValue}
													customErrorMessage={
														<>
															{invalidPhone && (
																<div className="custom-message-error">
																	<p>Неправильный номер телефона.</p>
																</div>
															)}
														</>
													}
												/>

												{!!documentsTermsOfUseOptions && (
													<Checkbox
														className="checkbox-agreement"
														options={documentsTermsOfUseOptions}
														fieldName={fieldNameConfirmAgreement}
														type="checkbox"
														onChange={(value) => setAgreement(value.checked)}
													/>
												)}
											</div>
										);
									}
									case true: {
										return (
											<div
												className="wrapper-sms text-center"
												onKeyUp={(event: React.KeyboardEvent<HTMLDivElement>) => {
													if (event.key === 'Enter') {
														event.preventDefault();
														// noinspection JSIgnoredPromiseFromCall
														onSubmitSms();
													}
												}}
												role="button"
												tabIndex={0}
											>
												<div className="body1">Введите код из СMC, отправленный на номер</div>
												<div className="body1">{phoneValue?.formattedValue}</div>
												<InputMask
													type="sms"
													mask="9     9     9     9"
													fieldName={fieldNameSmsCode}
													onChange={handleChangeSms}
													errors={smsError}
													placeholder={'_     _     _     _'}
												/>
												{/* <input id="single-factor-code-text-field" autoComplete="one-time-code" /> */}
												{smsSent && (
                                                    <p className="gray-light">Отправить код через</p>
												)}

												{!smsSent && (
													<Button
														buttontype={ECustomButtonTypes.link}
														onClick={onSubmitPhone}
														disabled={smsSent}
													>
														Отправить код ещё раз
													</Button>
												)}
											</div>
										);
									}
									default:
										return null;
								}
							})()}
						</div>

						<div className="sigin-buttons">
							{(() => {
								switch (phoneSent) {
									case false: {
										return (
											<div className="form__section form__section-buttons">
												<Button
													type="button"
													disabled={submittingPhone || !isValidPhone || agreement === false}
													onClick={onSubmitPhone}
												>
													Войти
												</Button>
											</div>
										);
									}
									case true: {
										return (
											<div className="form__section form__section-buttons">
												<Button
													type="button"
													disabled={smsValue?.length !== 4}
													onClick={onSubmitSms}
												>
													Отправить
												</Button>
											</div>
										);
									}
									default:
										return null;
								}
							})()}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
