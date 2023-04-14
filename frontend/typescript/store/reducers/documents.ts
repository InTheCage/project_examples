import { EDocumentsActions } from '../../enums/actions.enum';
import { IDocumentsState, TDocumentsAction } from '../../interfaces/documents';

const initState: IDocumentsState = {
	doctorList: null,
	documentTypes: null,
	documentList: null,
	documentsTermsOfUse: null,
	loadingDocuments: false,
};

const initialState = { ...initState };

export const documentsReducer = (state = initialState, action: TDocumentsAction): IDocumentsState => {
	switch (action.type) {
		case EDocumentsActions.SetDocuments:
			return { ...state, documentList: action.payload };
		case EDocumentsActions.SetDocumentTypes:
			return { ...state, documentTypes: action.payload };
		case EDocumentsActions.SetDoctorsList:
			return { ...state, doctorList: action.payload };
		case EDocumentsActions.SetLoadingDocuments:
			return { ...state, loadingDocuments: action.payload };
		case EDocumentsActions.SetDocumentsTermsOfUse:
			return { ...state, documentsTermsOfUse: action.payload };
		default:
			return state;
	}
};
