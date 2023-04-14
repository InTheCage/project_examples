import { useEffect } from 'react';

export default function Fallback() {
	const nprogressLib = import('nprogress');
	// @ts-ignore
	import('nprogress/nprogress.css');
	useEffect(() => {
		nprogressLib.then((nprogress) => {
			nprogress.configure({ showSpinner: false });
			nprogress.start();
		});
		return () => {
			nprogressLib.then((nprogress) => nprogress.done());
		};
	}, []);
	return null;
}
