import React from 'react';

// Non-animated placeholder for fast-loading flows. Keeps the UI from
// showing an empty white area while content loads.
const FastLoadingSpinner: React.FC = () => (
	<div role="status" aria-live="polite" className="text-slate-400 text-sm">
		Loading…
	</div>
);

export default FastLoadingSpinner;