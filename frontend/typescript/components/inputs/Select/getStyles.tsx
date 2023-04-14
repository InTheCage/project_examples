import { ISelect } from './index';
import searchIconSVG from '../../../static/images/icons/icon_search.svg';
import searchIconCloseSVG from '../../../static/images/icons/icon_search_close.svg';
import selectIconUpSVG from '../../../static/images/icons/arrowBottom.svg';

const containerStyles = (type: ISelect['type']) => {
	return {
		position: 'relative',
		zIndex: '2',
		border: 'none',
		borderRadius: '0.625rem',
		background: '#fff',
		textAlign: 'left',
	};
};
const controlStyles = (type: ISelect['type']) => {
	return {
		height: '2.5rem',
		borderRadius: '0.9375rem',
		border: '2px #e0e3ef solid',
		display: 'flex',
		alignItems: 'center',
		cursor: 'pointer',
		boxShadow: 'none',
		'&:hover': {
			borderColor: '#e0e3ef',
		},
		'@media (max-width: 768px)': {
			borderRadius: '0.625rem',
		},
	};
};
const groupStyles = (type: ISelect['type']) => {
	return {
		fontSize: '0.875rem',
		margin: '0 1.25rem',
		padding: '0.5rem 0',
		borderTop: '1px #f0f4ff solid',
		'&:first-child': {
			borderColor: '#e0e3ef',
		},
	};
};
const valueContainerStyles = (type: ISelect['type']) => {
	const searchStyle =
		type === 'search'
			? {
					backgroundImage: `url(${searchIconSVG})`,
					backgroundRepeat: 'no-repeat',
					backgroundPosition: '11px 9px',
					backgroundSize: '17.5px 17.5px',
					padding: '0 35px 0 41px',
					fontSize: '0.875rem',
			  }
			: {};

	return {
		padding: '0 15px 0 20px',
		fontSize: '1rem',
		color: '#504f53',
		display: 'flex',
		flexWrap: 'nowrap',
		overflowX: 'hidden',
		height: '2.25rem',
		position: 'relative',
		zIndex: '100',
		backgroundImage: `url(${selectIconUpSVG})`,
		backgroundRepeat: 'no-repeat',
		backgroundPosition: '95% 45%',
		backgroundSize: '14px 8px',
		...searchStyle,
	};
};
const inputStyles = (type: ISelect['type']) => {
	const styles = {
		fontSize: '0.875rem',
		letterSpacing: '0.0094rem',
		color: '#000',
		height: '2.25rem',
		padding: '0',
		margin: '0',
		boxShadow: 'none',
		display: 'flex',
		alignItems: 'center',
		overflow: 'hidden',
	};
	return styles;
};
const placeholderStyles = (type: ISelect['type']) => {
	const styles = {
		fontSize: '0.875rem',
		color: '#504f53',
		padding: '0',
		margin: '0',
		display: 'block',
		alignItems: 'center',
		maxWidth: 'calc(100% - 65px)',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
	};
	return styles;
};
const indicatorsContainerStyles = (type: ISelect['type']) => {
	return {
		display: 'none',
	};
};
const indicatorSeparatorStyles = (type: ISelect['type']) => {
	return {
		display: 'none',
	};
};

const clearIndicatorStyles = (type: ISelect['type']) => {
	return {
		display: 'none',
	};
};
const multiValueStyles = (type: ISelect['type']) => {
	return {
		padding: '4px',
		borderRadius: '6px',
		zIndex: 22,
	};
};
const menuStyles = (type: ISelect['type']) => {
	// @ts-ignore
	const searchStyle =
		type === 'search'
			? {
				'&:before': {
					content: '""',
					display: 'block',
					position: 'absolute',
					top: '14px',
					right: '22px',
					height: '12px',
					width: '12px',
					zIndex: '100',
					backgroundImage: `url(${searchIconCloseSVG})`,
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'right top',
					'@media (max-width: 768px)': {
						right: '10px',
					},
				},
			  }
			: {};

	return {
		borderRadius: '0.9375rem',
		border: '2px #e0e3ef solid',
		borderTop: 'none',
		top: '-0.4rem',
		width: '100%',
		paddingTop: '1.2rem',
		boxShadow: '0px 4px 20px rgba(172, 154, 223, 0.23)',
		...searchStyle,
	};
};
const menuListStyles = (type: ISelect['type']) => {
	const searchStyle =
		type === 'search'
			? {
				'&:before': {
					display: 'none',
				},
			  }
			: {};

	return {
		marginTop: '1rem',
		'&::-webkit-scrollbar': {
			width: '4px',
			background: 'transparent',
		},
		'&::-webkit-scrollbar-track': {
			width: '6px',
			marginBottom: '20px',
			background: 'transparent',
		},
		'&::-webkit-scrollbar-thumb': {
			background: '#838b99',
			borderRadius: '24px',
		},
		'&:before': {
			content: '""',
			display: 'block',
			height: '0.8rem',
			borderTop: '2px #e0e3ef solid',
			margin: '0 20px',
			position: 'relative',
			top: '-3px',
		},
		...searchStyle,
	};
};
export const optionStyles = (type: ISelect['type']) => {
	const searchStyle =
		type === 'search'
			? {
				//paddingLeft: '22px',
			  }
			: {};

	return {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.875rem',
		color: '#504f53',
		cursor: 'pointer',
		background: '#fff',
		paddingLeft: '22px',
		'&:hover': {
			background: '#f0f4ff',
		},
		...searchStyle,
	};
};
const groupHeadingStyles = (type: ISelect['type']) => {
	return {
		fontSize: '0.875rem',
		fontWeight: '500',
		lineHeight: '1.3',
		letterSpacing: '0.0094rem',
		textTransform: 'none',
		color: '#b7bcd0',
		paddingLeft: '22px',
	};
};
const dropdownIndicatorStyles = (type: ISelect['type']) => {
	return {};
};
const singleValueStyles = (type: ISelect['type']) => {
	return {
		maxWidth: 'calc(100% - 65px)',
		textOverflow: 'ellipsis',
	};
};

export function getStyles(type: ISelect['type']) {
	const selectStyles = {
		container: (styles: any) => ({ ...styles, ...containerStyles(type) }),
		group: (styles: any) => ({ ...styles, ...groupStyles(type) }),
		input: (styles: any) => ({ ...styles, ...inputStyles(type) }),
		placeholder: (styles: any) => ({ ...styles, ...placeholderStyles(type) }),
		control: (styles: any) => ({ ...styles, ...controlStyles(type) }),
		valueContainer: (styles: any) => ({ ...styles, ...valueContainerStyles(type) }),
		indicatorsContainer: (styles: any) => ({ ...styles, ...indicatorsContainerStyles(type) }),
		indicatorSeparator: (styles: any) => ({ ...styles, ...indicatorSeparatorStyles(type) }),
		clearIndicator: (styles: any) => ({ ...styles, ...clearIndicatorStyles(type) }),
		multiValue: (styles: any) => ({ ...styles, ...multiValueStyles(type) }),
		menu: (styles: any) => ({ ...styles, ...menuStyles(type) }),
		menuList: (styles: any) => ({ ...styles, ...menuListStyles(type) }),
		option: (styles: any) => ({ ...styles, ...optionStyles(type) }),
		groupHeading: (styles: any) => ({ ...styles, ...groupHeadingStyles(type) }),
		dropdownIndicator: (styles: any) => ({ ...styles, ...dropdownIndicatorStyles(type) }),
		singleValue: (styles: any) => ({ ...styles, ...singleValueStyles(type) }),
	};

	return selectStyles;
}
