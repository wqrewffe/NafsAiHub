import React from 'react';

// Admin banner modification has been disabled to avoid rendering stale,
// admin-controlled content that could briefly flash for end users.
// This placeholder keeps the route intact but performs no persistence.

export default function ModifyPage(): React.ReactElement {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin — Modify Top Banner (Disabled)</h1>
      <p className="mt-4 text-slate-400">The admin banner feature has been disabled to prevent stale UI flashes. The modify UI and persistence have been removed.</p>
    </div>
  );
}
