/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/jsx-no-target-blank */
import React, { ReactNode } from 'react';
import cn from 'classnames';

import Avatar from './Avatar';
import { Routes } from '../../enums/routes.enum';

import logo from '../../static/images/logo.svg';
import './MainLayout.scss';

interface IProps {
	children: ReactNode;
}

export default function MainLayout({ children }: IProps) {
	const activePath = window.location.hash.split('/').filter((i) => i !== '')[1] || Routes.Home;

	return (
		<div className="main-layout">
			<header className="header header-expanded">
				<div className="header-expanded-left">
					<a href={`${process.env.REACT_APP_SITE}`} target="_blank" rel="noreferrer" className="logo-link">
						<img src={logo} className="logo" alt="Магеря — клиника гормонального здоровья" />
					</a>
					<a href={`${process.env.REACT_APP_SITE}`} className="back">
						На&nbsp;сайт magerya.ru
					</a>
				</div>
				<div className="header-expanded-center">
					<nav className="header__nav">
						<input type="checkbox" name="menu" id="menu" className="header-menu-input" />
						<label className="header-menu-label" htmlFor="menu">
							<span>
								<></>
							</span>
							<span>
								<></>
							</span>
							<span>
								<></>
							</span>
							<span>
								<></>
							</span>
						</label>
						<ul className="header-menu">
							<li className={cn({ active: activePath === Routes.Chat || activePath === Routes.Home })}>
								<a href={`/lk/#${Routes.Chat}`}>Чат</a>
							</li>
							<li>
								<a href={`${process.env.REACT_APP_SITE}/services/appointments`} target="_blank">
									Услуги и цены
								</a>
							</li>
							<li className={cn({ active: activePath === Routes.Analyzes })}>
								<a href={`/lk/#${Routes.Analyzes}`}>Документы</a>
							</li>
						</ul>
					</nav>
				</div>
				<div className="header-expanded-right">
					<a href={`/lk/#/appointment`} className="button-default">
						Записаться&nbsp;<span className="hidden">на приём</span>
					</a>
					<Avatar />
				</div>
			</header>
			<main className="content">{children}</main>
			<footer>&nbsp;</footer>
		</div>
	);
}
