import { MainLayout } from '../../layouts';
import errorIcon from '../../static/images/icons/icon_404.svg';
import './Error.scss';

export default function ErrorPage() {
	return (
		<MainLayout>
			<div className="error-wrap container shadow rad20">
				<div className="error-left">
					<img src={errorIcon} className="icon-404" alt="404" />
				</div>
				<div className="error-right">
					<div className="error-title">У нас такой страницы нет</div>
					<div className="error-subtitle">Воспользуйтесь меню нашего сайта</div>
				</div>
			</div>
		</MainLayout>
	);
}
