import React from 'react';

function StockOverview({ products, handleOpenPrintLabel }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stock overview</h2>
          <p className="text-sm text-slate-400">Low stock alerts appear automatically when a product is scanned.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Barcode</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.map((product) => (
              <tr key={product.barcode} className="text-slate-200">
                <td className="px-3 py-3">{product.name}</td>
                <td className="px-3 py-3">{product.barcode}</td>
                <td className="px-3 py-3">₹{Number(product.price).toFixed(2)}</td>
                <td className="px-3 py-3">{product.stock}</td>
                <td className="px-3 py-3">
                  {product.stock < 3 ? (
                    <span className="text-amber-400">Low stock</span>
                  ) : (
                    <span className="text-emerald-400">Healthy</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="rounded-2xl border border-emerald-500/40 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/10 cursor-pointer"
                    onClick={() => handleOpenPrintLabel(product)}
                  >
                    Print label
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StockOverview;
