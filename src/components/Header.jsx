import React from 'react';

function Header() {
  return (
    <header className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-10 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">Inventory Scanner Hub</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Express Shop Stock Controller</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Scan product barcodes to instantly ring them up. Deducts stock by one, updates database, and triggers alerts for items below 3 units.
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
