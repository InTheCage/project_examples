import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { profileSelector } from '../../../store/selectors/profileSelectors';

import './Avatar.scss';

export default function Avatar() {
	const history = useHistory();
	const profile = useSelector(profileSelector);

	const shortName = [(profile?.first_name || '')[0], (profile?.last_name || '')[0]].join('');

	return (
		<div className="avatar-wrap cursor-pointer" onClick={() => history.push('/profile')} role="button" tabIndex={0}>
			<div className="avatar-shortname-wrap">
				<span className="avatar-shortname">{shortName}</span>
			</div>
			<span className="avatar-fullname">
				{profile?.first_name} {profile?.last_name}
			</span>
		</div>
	);
}
