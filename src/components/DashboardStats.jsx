import React from 'react';

function DashboardStats({ productsCount, lowStockCount, cartUnitsCount, cartTotal }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center backdrop-blur-md">
        <span className="text-xs uppercase tracking-wider text-slate-400">Catalog Size</span>
        <p className="mt-2 text-2xl font-bold text-indigo-400">{productsCount} Products</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center backdrop-blur-md">
        <span className="text-xs uppercase tracking-wider text-slate-400">Low Stock items</span>
        <p className={`mt-2 text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
          {lowStockCount} Alerts
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center backdrop-blur-md">
        <span className="text-xs uppercase tracking-wider text-slate-400">Rung Up Items</span>
        <p className="mt-2 text-2xl font-bold text-emerald-400">
          {cartUnitsCount} Units
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center backdrop-blur-md">
        <span className="text-xs uppercase tracking-wider text-slate-400">Current Total</span>
        <p className="mt-2 text-2xl font-bold text-emerald-400">${cartTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default DashboardStats;
