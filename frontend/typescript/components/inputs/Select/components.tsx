import { ISelectGroupOptions } from '.';

export function formatGroupLabel(data: ISelectGroupOptions) {
	return (
		<div className="select-group-label-wrap">
			<span className="select-group-label">{data.label}</span>
			<span className="select-group-label-count">{data.options.length}</span>
		</div>
	);
}
