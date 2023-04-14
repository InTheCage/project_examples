import React from 'react';
/* eslint-disable jsx-a11y/label-has-associated-control */
import { useSelector, useDispatch } from 'react-redux';

import { cancelDialogAction, setDialogAction } from '../../store/actions/dialog';
import { logout } from '../../store/actions/profile';
import { profileSelector } from '../../store/selectors/profileSelectors';

import { Button } from '../../components';
import { EmailInput } from './components';
import { MainLayout } from '../../layouts';
import { ECustomButtonTypes } from '../../enums/button-types.enum';

import './Profile.scss';

export const changeEmailFormId = 'changeEmailFormId';

export default function ProfilePage() {
	const dispatch = useDispatch();
	const profile = useSelector(profileSelector);

	function onCancel() {
		dispatch(cancelDialogAction());
	}

	function onOk() {
		dispatch(cancelDialogAction());
		dispatch(logout());
	}

	function handleLogout() {
		const dialogLogoutData = {
			onOk,
			autoClose: false,
			onCancel,
			onClose: onCancel,
			maxWidth: '35rem',
			onOkText: 'Выйти',
			onCancelText: 'Отменить',
			titleText: (
				<span
					style={{
						maxWidth: '22rem',
						display: 'inline-block',
						marginBottom: '1.2rem',
					}}
				>
					Вы уверены, что хотите выйти из профиля?
				</span>
			),
		};
		dispatch(setDialogAction(dialogLogoutData));
	}

	const dateInstance = profile?.birthdate ? new Date(profile.birthdate) : null;
	const birthdate = dateInstance
		? new Intl.DateTimeFormat('ru', {
				timeZone: 'Europe/Moscow',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
		  }).format(dateInstance)
		: null;

	const dateToday = new Intl.DateTimeFormat('ru', {
		timeZone: 'Europe/Moscow',
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	}).format(Date.now());

	return (
		<MainLayout>
			<div className="profile-wrap container shadow rad20">
				<div className="profile-header">
					<div className="profile-header-left">
						<div className="profile-title">Мой профиль</div>
						<div className="today">Сегодня: {dateToday}</div>
					</div>
					<div className="profile-header-right">
						<Button buttontype={ECustomButtonTypes.exit} onClick={handleLogout}>
							Выйти из профиля
						</Button>
					</div>
				</div>
				<div className="profile-content">
					<div className="profile-content-left">
						<div className="input-wrap">
							<div className="input-label">Имя</div>
							<div className="input-value">
								<input value={profile?.first_name || ''} readOnly />
							</div>
						</div>
						<div className="input-wrap">
							<div className="input-label">Отчество</div>
							<div className="input-value">
								<input value={profile?.patronymic || ''} readOnly />
							</div>
						</div>
						<div className="input-wrap">
							<div className="input-label">Фамилия</div>
							<div className="input-value">
								<input value={profile?.last_name || ''} readOnly />
							</div>
						</div>
						<div className="input-wrap">
							<div className="input-label">Пол</div>
							<div className="input-value">
								<input value={profile?.sex ? 'Мужской' : 'Женский'} readOnly />
							</div>
						</div>
						<div className="input-wrap">
							<div className="input-label">Дата рождения</div>
							<div className="input-value">
								<input value={birthdate || 'не указана'} readOnly />
							</div>
						</div>
					</div>
					<div className="profile-content-right">
						<EmailInput />
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
