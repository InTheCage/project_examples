import { ThunkAction } from 'redux-thunk';

import { Dispatch } from 'redux';
import { documentsApi } from '../../api';
import defaultErrorCallback from '../../utils/helpers/defaultErrorCallback';

import { RootState } from '../rootReducer';
import { ISetDocumentsTermOfUseAction, ISetLoadingDocumentsAction, TDocumentsAction } from '../../interfaces/documents';
import { EDocumentsActions } from '../../enums/actions.enum';
import { ISearchDocumentsParams, ITermOfUse } from '../../interfaces/documentsApi';

export const setDocumentsTermOfUseAction = (payload: ITermOfUse[]): ISetDocumentsTermOfUseAction => ({
	type: EDocumentsActions.SetDocumentsTermsOfUse,
	payload,
});

export const setLoadingDocumentsAction = (status: boolean): ISetLoadingDocumentsAction => ({
	type: EDocumentsActions.SetLoadingDocuments,
	payload: status,
});

export const getDoctorListAction = (): TActions => async (dispatch, getState) => {
	try {
		if (getState().documents.doctorList) return;
		const { data: doctorList } = await documentsApi.getDoctorList();
		dispatch({
			type: EDocumentsActions.SetDoctorsList,
			payload: doctorList,
		});
	} catch (error) {
		console.error(error);
		defaultErrorCallback({
			errorMessage:
				'Произошла ошибка.',
		});
	}
};

export const getDocumentsTermOfUseThunk = () => async (dispatch: Dispatch) => {
	try {
		const { data } = await documentsApi.getTermsOfUse();
		dispatch(setDocumentsTermOfUseAction(data));
	} catch (err) {
		console.error(err);
		throw Error(err);
	}
};

export const getDocumentTypesAction = (): TActions => async (dispatch, getState) => {
	try {
		if (getState().documents.documentTypes) return;
		const { data: documentTypes } = await documentsApi.getDocumentTypes();
		dispatch({
			type: EDocumentsActions.SetDocumentTypes,
			payload: documentTypes,
		});
	} catch (error) {
		console.error(error);
		defaultErrorCallback({
			errorMessage:
				'Произошла ошибка. Пожалуйста, перезагрузите страницу',
		});
	}
};

export const getDocumentListAction = (params?: ISearchDocumentsParams): TActions => async (dispatch, getState) => {
	try {
		dispatch(setLoadingDocumentsAction(true));
		const {
			data: { results: documentList },
		} = await documentsApi.getDocumentList(params);
		dispatch({
			type: EDocumentsActions.SetDocuments,
			payload: documentList,
		});
	} catch (error) {
		console.error(error);
		defaultErrorCallback({
			errorMessage:
				'Произошла неизвестная ошибка, перезагрузите страницу',
		});
	} finally {
		dispatch(setLoadingDocumentsAction(false));
	}
};

type TActions = ThunkAction<Promise<void>, RootState, unknown, TDocumentsAction>;
