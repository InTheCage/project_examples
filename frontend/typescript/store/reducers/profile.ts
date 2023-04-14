import { EProfileTypeActions } from '../../enums/actions.enum';
import { IProfileState, TProfileActions } from '../../interfaces/profile';

const initState: IProfileState = {
	isAuth: null,
	voximplant: null,
	profile: null,
};

const initialState = { ...initState };

export const profileReducer = (state = initialState, action: TProfileActions): IProfileState => {
	switch (action.type) {
		case EProfileTypeActions.SetProfile:
			return {
				...state,
				profile: action.payload,
				voximplant: action.payload?.voximplant || null,
			};
		case EProfileTypeActions.SetIsAuth: {
			return { ...state, isAuth: action.payload };
		}
		case EProfileTypeActions.Logout: {
			localStorage.removeItem('token');
			// const prevUrl = window.location?.hash?.replace?.('#', '');
			// if (!prevUrl.includes('signin')) {
			// 	localStorage.setItem(localStorageItems.logoutlURL, prevUrl);
			// }
			return { ...initState, isAuth: false };
		}
		default:
			return state;
	}
};
