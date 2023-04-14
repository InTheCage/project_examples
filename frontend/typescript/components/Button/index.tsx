import { ReactNode, MouseEvent } from 'react';
import cn from 'classnames';
import { EButtonTypes, ECustomButtonTypes } from '../../enums/button-types.enum';
import './Button.scss';

interface IProps {
	children: ReactNode | string;
	onClick?: (e: MouseEvent) => void;
	buttontype?: ECustomButtonTypes;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	[key: string]: any;
}

export default function Button(props: IProps) {
	const {
		children,
		loading,
		disabled,
		type = EButtonTypes.button,
		buttontype = ECustomButtonTypes.default,
		className,
		...rest
	} = props;
	return (
		<button
			{...{ type, ...rest }}
			disabled={loading || disabled}
			className={cn({ [`button-${buttontype}`]: !!buttontype }, className)}
		>
			{loading && 'spin'}
			{children}
		</button>
	);
}
