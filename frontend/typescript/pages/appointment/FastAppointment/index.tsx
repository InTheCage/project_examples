import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { setMedicineDirectionsThunk } from '../../../store/actions/appointment';
import { profileIsAuthSelector, profileSelector } from '../../../store/selectors/profileSelectors';
import {
	medicineDirectionsSelector,
	optionsMedicineDirectionsSelector,
	valuesCreateAppointmentSelector,
} from '../../../store/selectors/appointmentSelectors';

import { Checkbox, Input, Button } from '../../../components';
import InputPhone from '../../../components/inputs/InputPhone';

import defaultErrorCallback from '../../../utils/helpers/defaultErrorCallback';

import { appointmentApi, documentsApi } from '../../../api';

import { mockOptionsSelectDetails } from '../../../mockData';
import { ECustomButtonTypes } from '../../../enums/button-types.enum';

import { useResponsive } from '../../../hooks';

import './FastAppointment.scss';
import { getDocumentsTermOfUseThunk } from '../../../store/actions/documents';
import { getErrorString } from '../../../utils/helpers/getErrorString';
import { IOption } from '../../../components/inputs/Checkbox';
import { ITermOfUse } from '../../../interfaces/documentsApi';

const fieldNameSelectMedicine = 'medicineDirection';
const fieldNameSelectDetails = 'childrenConsultation';
const fieldNameSelectConfirm = 'agreement';
const fieldNameName = 'name';
const fieldNamePhone = 'phone';
const formId = 'fast-appointment-form';

export default function FastAppointment() {
	const dispatch = useDispatch();
	const profile = useSelector(profileSelector);
	const isAuth = useSelector(profileIsAuthSelector);
	const medicineDirections = useSelector(medicineDirectionsSelector);
	const optionsMedicine = useSelector(optionsMedicineDirectionsSelector);
	const valuesCreateAppointment = useSelector(valuesCreateAppointmentSelector);

	const { register, handleSubmit, errors, control, setError } = useForm();

	const [documentsTermsOfUse, setDocumentsTermsOfUse] = useState<ITermOfUse[]>();
	const [documentsTermsOfUseOptions, setDocumentsTermsOfUseOptions] = useState<IOption[]>();
	const [medicineDirection, setMedicineDirection] = useState<IOption>();
	const [isSuccess, setIsSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const defaultValMedicineDirection = useMemo<IOption | undefined>(() => {
		return optionsMedicine?.find((option) => {
			return option.value === valuesCreateAppointment.currentBranch;
		});
	}, [optionsMedicine, valuesCreateAppointment.currentBranch]);

	const { isMobile } = useResponsive();

	useEffect(() => {
		async function handle() {
			try {
				await dispatch(setMedicineDirectionsThunk());
				await dispatch(getDocumentsTermOfUseThunk());
				const { data: documents } = await documentsApi.getTermsOfUse();
				setDocumentsTermsOfUse(documents);
			} catch (err) {
				defaultErrorCallback({ errorMessage: getErrorString(err) });
			}
		}
		handle();
	}, []);

	useEffect(() => {
		setMedicineDirection(defaultValMedicineDirection);
	}, [defaultValMedicineDirection]);

	useEffect(() => {
		// WARNING!!!
		// Дублирование логики documentsTermsOfUseOptionsSelector с адаптацией под FastAppointment 22.04.2022
		function handle() {
			const isPsychology = Boolean(
				medicineDirections.find((direction) => {
					if (direction.branch.id === Number(medicineDirection?.value)) {
						return direction.branch.psychology;
					}
					return false;
				}),
			);

			const webDocuments = documentsTermsOfUse?.filter(({ key }) => {
				if (key?.includes('offer_agreement') && !isPsychology) {
					return false;
				}
				if (key?.includes('provision_of_paid_medical_services_rules') && isPsychology) {
					return false;
				}
				return !key?.includes('app');
			});
			setDocumentsTermsOfUseOptions(
				webDocuments
					? [
							{
								value: 'agreement',
								name: 'Я ознакомлен(а) и принимаю договор, согласие на обработку персональных данных',
								label: (
									<span>
										Я ознакомлен(а) и принимаю
										{webDocuments?.map(({ document, name, key }) => {
											return (
												<>
													,{' '}
													<a href={document || ''} target="_blank" key={key} rel="noreferrer">
														{name}
													</a>
												</>
											);
										})}
										.
									</span>
								),
							},
					  ]
					: undefined,
			);
		}
		handle();
	}, [documentsTermsOfUse, defaultValMedicineDirection, medicineDirection]);

	const onSubmit = handleSubmit(async function onSubmitHandler(data: any) {
		// валидация номера телефона
		// так
		const phone = data[fieldNamePhone].value || data[fieldNamePhone];
		const lengthMask = phone?.split?.('')?.filter?.((i: string) => i === '.').length;
		const isValid = !phone ? false : lengthMask - 2 <= phone?.length;
		if (!isValid) {
			setError(fieldNamePhone, { type: 'required' });
			return;
		}
		// если номер телефона валиден
		try {
			setLoading(true);

			await appointmentApi.createFastAppointment({
				branch_id: data.medicineDirection as string,
				phone: phone.includes('+') ? phone : `+${phone}`,
				child: !!data?.childrenConsultation?.includes('children_consultation'),
				name: data?.name as string,
				auth: isAuth as boolean,
			});
			setIsSuccess(true);
		} catch (error) {
			if (error?.response?.data?.errors?.phone) {
				defaultErrorCallback({ errorMessage: 'Указан некорректный номер телефона' });
			} else {
				defaultErrorCallback({
					errorMessage: 'Произошла неизвестная ошибка. Пожалуйста, обратитесь в клинику по телефону.',
				});
				setIsSuccess(false);
			}
		} finally {
			setLoading(false);
		}
	});

	const successContent = (
		<>
			<div className="success-content fast-appointment__gradient">
				<div className="fast-appointment__title">
					<p>Спасибо за обращение в нашу клинику!</p>
				</div>
				<p>Наш администратор с вами свяжется и поможет определиться со специалистом и временем посещения</p>
			</div>
			<div className="fast-appointment-footer success buttons-footer">
				<Button
					className="fast-appointment__submit-button"
					type="button"
					onClick={() => setIsSuccess(false)}
					buttontype={ECustomButtonTypes.borderBlue}
				>
					Записаться к другому специалисту
				</Button>
			</div>
		</>
	);

	return (
		<div className="fast-appointment shadow rad10">
			{isSuccess ? (
				successContent
			) : (
				<>
					<div className="fast-appointment__gradient">
						<div className="fast-appointment__title">
							<p>Администратор перезвонит вам и предложит удобное время записи</p>
						</div>
					</div>
					<div className="fast-appointment__form-title">Укажите, пожалуйста</div>
					<form className={formId} id={formId} onSubmit={onSubmit} autoComplete="off">
						<div className="fast-appointment__content-left">
							<InputPhone
								className={'input-phone'}
								control={control}
								fieldName={fieldNamePhone}
								labelText="Ваш номер телефона"
								placeholder="Ваш номер телефона"
								required
								errors={errors?.[fieldNamePhone]}
								// TODO: Выяснить у Евгения Стоюшко, какой номер использовать 25.01.2022
								defaultValue={profile?.phone || profile?.user_phone || ''}
								requiredMessage="Пожалуйста, укажите номер телефона"
							/>
							<Input
								register={register}
								fieldName={fieldNameName}
								labelText="Ваше имя"
								placeholder="Ваше имя"
								required
								errors={errors?.[fieldNameName]}
								defaultValue={(
									[profile?.last_name, profile?.first_name, profile?.patronymic].join(' ') || ''
								).trim()}
							/>

							{isMobile ? (
								<></>
							) : (
								!!documentsTermsOfUseOptions && (
									<Checkbox
										className="checkbox-agreement"
										options={documentsTermsOfUseOptions}
										fieldName={fieldNameSelectConfirm}
										register={register}
										defaultValue={documentsTermsOfUseOptions[0]}
										type="checkbox"
										required
										errors={errors?.[fieldNameSelectConfirm]}
										requiredMessage="Для оказания услуг требуется ознакомиться и принять указанные документы."
									/>
								)
							)}
						</div>
						<div className="fast-appointment__content-right">
							<Checkbox
								options={mockOptionsSelectDetails}
								fieldName={fieldNameSelectDetails}
								register={register}
								type="checkbox"
								defaultValue={mockOptionsSelectDetails[1]}
							/>
							<Checkbox
								options={optionsMedicine}
								fieldName={fieldNameSelectMedicine}
								defaultValue={defaultValMedicineDirection}
								onChange={(val) => {
									setMedicineDirection(val.item);
								}}
								register={register}
								type="radio"
								visibleType="special"
								required
								errors={errors?.[fieldNameSelectMedicine]}
								requiredMessage="Пожалуйста, выберите направление медицины."
							/>
							{isMobile ? (
								!!documentsTermsOfUseOptions && (
									<Checkbox
										className="checkbox-agreement"
										options={documentsTermsOfUseOptions}
										fieldName={fieldNameSelectConfirm}
										register={register}
										type="checkbox"
										required
										errors={errors?.[fieldNameSelectConfirm]}
										requiredMessage="Для оказания услуг требуется ознакомиться и принять указанные документы."
									/>
								)
							) : (
								<></>
							)}
						</div>
					</form>
					<div className="fast-appointment-footer buttons-footer">
						<Button
							className="button-default fast-appointment__submit-button"
							type="submit"
							form={formId}
							loading={loading}
						>
							Отправить
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
