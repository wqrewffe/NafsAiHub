import React from 'react';

// Lightweight, non-animated placeholder used where pages previously returned
// a spinner-only view. This prevents blank/empty areas while keeping a
// consistent, non-jarring UX. Animations are intentionally disabled globally
// except for the generate button.
const Spinner: React.FC = () => {
	return (
		<div role="status" aria-live="polite" className="text-slate-400 text-sm">
			Loading…
		</div>
	);
};

export default Spinner;
