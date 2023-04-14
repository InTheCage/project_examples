import React, { useEffect, lazy, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { getProfileThunk } from './store/actions/profile';
import { RootState } from './store/rootReducer';

import FallbackSuspense from './components/FallbackSuspense';

import { Routes } from './enums/routes.enum';
import { useResponsive } from './hooks';

import './styles/Tabs.scss';
// import 'react-toastify/dist/ReactToastify.css';
// import './styles/Alert.scss';
import './styles/App.scss';

export default function App() {
	const dispatch = useDispatch();
	const isAuth = useSelector((state: RootState) => state.profile.isAuth);
	const { isMobile } = useResponsive();
	useEffect(() => {
		!window.location.pathname.includes(Routes.Appointment) && dispatch(getProfileThunk());
		if (isAuth) {
			import('./store/actions/videoCall').then(({ setVoxClientAction }) => dispatch(setVoxClientAction()));
		}
	}, [isAuth]);

	if (isAuth === null) return null;

	const AppointmentPage = lazy(() => import('./pages/appointment'));

	if (isAuth === false) {
		// @ts-ignore
		const Signin = lazy(() => import('./pages/signin'));
		return (
			<Suspense fallback={<FallbackSuspense />}>
				<Switch>
					<Route exact path={`/${Routes.Appointment}`} component={AppointmentPage} />
					<Route path={`/${Routes.Signin}`} component={Signin} />;
					<Redirect to={`/${Routes.Signin}`} />
				</Switch>
			</Suspense>
		);
	}
	const ProfilePage = lazy(() => import('./pages/profile'));
	const ErrorPage = lazy(() => import('./pages/error'));
	const AppsPage = lazy(() => import('./pages/apps'));
	const NotificationsListener = lazy(() => import('./utils/notifications'));
	// const ToastContainer = lazy(() => import('react-toastify').then((module) => ({ default: module.ToastContainer })));

	return (
		<Suspense fallback={<FallbackSuspense />}>
			<Switch>
                <Route exact path={`/${Routes.Appointment}`} component={AppointmentPage} />
                <Route exact path={`/${Routes.Profile}`} component={ProfilePage} />
                <Redirect from={`/${Routes.Signin}`} to={`/${Routes.Chat}`} />
                <Redirect from={`${Routes.Home}`} to={`/${Routes.Chat}`} />
                <Route path={'*'} component={ErrorPage} />
            </Switch>
			<NotificationsListener />
		</Suspense>
	);
}
