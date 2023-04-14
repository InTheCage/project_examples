import axios, { AxiosPromise } from 'axios';
import axiosFetch from './axiosFetch';

import {
	ISignInData,
	ISignInConfirmData,
	IResponseConfirm,
	ISignInResponseData,
	IPatchProfileData,
} from '../interfaces/signinApi';
import { IProfile } from '../interfaces/profile';

export default class SigninAPI {
	signIn(data: ISignInData) {
		return axios({
			method: 'post',
			url: `${process.env.REACT_APP_API}/lk-patient/auth/send-sms/`,
			data,
		}) as AxiosPromise<ISignInResponseData>;
	}

	signInConfirm(data: ISignInConfirmData) {
		return axios({
			method: 'post',
			url: `${process.env.REACT_APP_API}/lk-patient/auth/get-token/`,
			data,
		}) as AxiosPromise<IResponseConfirm>;
	}

	getProfile() {
		return axiosFetch({
			method: 'get',
			url: `${process.env.REACT_APP_API}/lk-patient/account/`,
			headers: { 'user-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone },
			isAuthorization: true,
		}) as AxiosPromise<IProfile>;
	}

	patchProfile(newProfile: IPatchProfileData) {
		return axiosFetch({
			method: 'patch',
			url: `${process.env.REACT_APP_API}/lk-patient/account/`,
			isAuthorization: true,
			data: newProfile,
		}) as AxiosPromise<IProfile>;
	}

	authVoximplant(data: { key: string }) {
		return axiosFetch({
			method: 'post',
			url: `${process.env.REACT_APP_API}/lk-patient/voximplant/one-time-token/`,
			data,
			isAuthorization: true,
		}) as AxiosPromise<{ token: string }>;
	}
}
