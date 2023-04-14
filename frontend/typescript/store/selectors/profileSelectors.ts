import { createSelector } from 'reselect';
import { RootState } from '../rootReducer';

const state = ({ profile }: RootState) => profile;

export const profilePhoneSelector = createSelector(state, ({ profile }) => profile?.phone);
export const profileIsAuthSelector = createSelector(state, ({ isAuth }) => isAuth);
export const profileStateSelector = createSelector(state, (profile) => profile);
export const profileSelector = createSelector(state, ({ profile }) => profile);
export const wardsSelector = createSelector(state, ({ profile }) => profile?.wards || null);
export const wardsOptionsSelector = createSelector(state, ({ profile }) => {
	const wards = profile?.wards;
	// {label: string, value: string, name: string}
	const newOptions =
		wards?.map((ward) => {
			return {
				label: `${ward.last_name} ${ward.first_name} ${ward.patronymic || ''}`,
				value: `${ward.id}`,
				name: `ward_id__${ward.id}`,
			};
		}) || [];
	newOptions.unshift({
		label: `${profile?.last_name} ${profile?.first_name} ${profile?.patronymic || ''}`,
		value: `${profile?.id}`,
		name: `profile_id__${profile?.id}`,
	});
	return newOptions;
});
