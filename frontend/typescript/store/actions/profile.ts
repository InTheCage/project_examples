import { Dispatch } from 'redux';
import { signInApi } from '../../api';

import { EProfileTypeActions } from '../../enums/actions.enum';
import { TProfileActions, ISetIsAuthAction, ISetProfileAction, IProfile } from '../../interfaces/profile';

export const setProfileAction = (payload: IProfile | null): ISetProfileAction => ({
	type: EProfileTypeActions.SetProfile,
	payload,
});

export const setIsAuthAction = (payload: boolean): ISetIsAuthAction => ({
	type: EProfileTypeActions.SetIsAuth,
	payload,
});

export const logout = (): TProfileActions => ({
	type: EProfileTypeActions.Logout,
});

export const getProfileThunk = () => async (dispatch: Dispatch) => {
	if (localStorage.token) {
		try {
			const { data: profile } = await signInApi.getProfile();
			dispatch(setProfileAction(profile));
			dispatch(setIsAuthAction(true));
		} catch (error) {
			console.error(error);
			dispatch(setIsAuthAction(false));
		}
	} else {
		dispatch(setIsAuthAction(false));
	}
};
