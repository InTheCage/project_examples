import React from 'react';
import { IOSView, AndroidView, BrowserView } from 'react-device-detect';
import IconAppStore from '../../static/images/icons/icon_appstore.svg';
import IconGooglePlay from '../../static/images/icons/icon_googleplay.svg';
import SplashLogo from '../../static/images/logo.svg';
import SplashPicture from '../../static/images/splashPicture.png';
import './Apps.scss';

export default function AppsPage() {
	const appStoreLink = (
		<a href="https://apps.apple.com/ru/app/ооо-телемедицина/id1608887991" target="_blank" rel="noreferrer">
			скачайте мобильное приложение
			<img src={IconAppStore} className="app-icon" alt="Загрузите в App Store" />
		</a>
	);

	const googleplayLink = (
		<a href="https://play.google.com/store/apps/details?id=ru.spider.magerya" target="_blank" rel="noreferrer">
			скачайте мобильное приложение
			<img src={IconGooglePlay} className="app-icon" alt="Загрузите в Google Play" />
		</a>
	);
	return (
		<div className="apps-page">
			<img src={SplashLogo} className="splash-logo" alt="Магеря - клиника гормонального здоровья" />
			<img src={SplashPicture} className="splash-picture" alt="Магеря - клиника гормонального здоровья" />
			<div className="apps-page-links">
				Для продолжения работы
				<br /> в личном кабинете
				<BrowserView>
					{appStoreLink}
					{googleplayLink}
				</BrowserView>
				<IOSView>{appStoreLink}</IOSView>
				<AndroidView>{googleplayLink}</AndroidView>
			</div>
		</div>
	);
}
