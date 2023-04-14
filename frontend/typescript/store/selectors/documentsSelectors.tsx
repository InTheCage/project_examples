import React from 'react';
import { createSelector } from 'reselect';
import { RootState } from '../rootReducer';
import { isFastAppointmentSelector, valuesCreateAppointmentSelector } from './appointmentSelectors';

const state = ({ documents }: RootState) => documents;

export const documentsTypesOptionsSelector = createSelector(state, ({ documentTypes }) => {
	return documentTypes?.map((type) => ({ label: type.label, value: type.value, name: type.value })) || [];
});
export const documentsTermsOfUseSelector = createSelector(state, ({ documentsTermsOfUse }) => documentsTermsOfUse);
export const documentsTermsOfUseOptionsSelector = createSelector(
	state,
	valuesCreateAppointmentSelector,
	isFastAppointmentSelector,
	({ documentsTermsOfUse }, valuesCreateAppointment, isFastAppointment) => {
		// WARNING!!!
		// Изменяя логику обрати внимание на компонент FastAppointment
		// Там похожая логика отображения документов
		// Но на локальном стейте 22.04.2022
		const webDocuments = documentsTermsOfUse?.filter(({ key }) => {
			if (
				key?.includes('provision_of_paid_medical_services_rules') &&
				valuesCreateAppointment?.isPsychology &&
				valuesCreateAppointment?.appointmentType === 'online' &&
				!isFastAppointment
			) {
				return false;
			}
			if (
				key?.includes('offer_agreement') &&
				valuesCreateAppointment?.appointmentType !== 'online' &&
				!isFastAppointment
			) {
				return false;
			}
			return !key?.includes('app');
		});
		return webDocuments
			? [
					{
						value: 'agreement',
						name: '',
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
			: undefined;
	},
);

export const documentsListSelector = createSelector(state, ({ documentList }) => documentList);
export const loadingDocumentsSelector = createSelector(state, ({ loadingDocuments }) => loadingDocuments);
