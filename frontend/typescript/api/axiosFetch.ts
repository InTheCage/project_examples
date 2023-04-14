import axios, { AxiosError, AxiosPromise, AxiosRequestConfig } from 'axios';

import { store } from '../store/store';
import { logout } from '../store/actions/profile';

export interface IConfigFetch extends AxiosRequestConfig {
	errorCallback?: (error: AxiosError) => void;
	checkAuthorization?: boolean;
	isAuthorization?: boolean;
}

export default async function axiosFetch(config: IConfigFetch) {
	let newConfig = { ...config };
	const { checkAuthorization = true, isAuthorization } = config;
	if (isAuthorization) {
		newConfig = {
			...config,
			headers: {
				...config?.headers,
				Authorization: `Token ${localStorage.token}`,
			},
		};
	}

	return axios(newConfig).catch((error: AxiosError) => {
		if (config.errorCallback) {
			config?.errorCallback?.(error);
		}
		if (checkAuthorization && error?.response?.status === 401) {
			store.dispatch(logout());
		}
		throw error;
	});
}
