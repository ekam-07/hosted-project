import React from 'react';

function InventoryCatalog({
  searchQuery,
  setSearchQuery,
  filteredProducts,
  handleAdjustStockInline,
  handleOpenPrintLabel,
  handleDeleteProduct
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-md sm:p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inventory Stock Catalog</h2>
          <p className="text-sm text-slate-400">Update stock parameters and delete entries directly.</p>
        </div>
        
        {/* Search Input bar */}
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search by name, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Barcode</th>
              <th className="px-4 py-3">Selling Price</th>
              <th className="px-4 py-3 text-center">Stock Level</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.barcode} className="hover:bg-slate-900/30 transition">
                  <td className="px-4 py-3 font-medium text-slate-100">
                    <div>
                      <p>{product.name}</p>
                      {product.details && <p className="text-[10px] text-slate-400 font-normal mt-0.5">{product.details}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-300">{product.barcode}</td>
                  <td className="px-4 py-3 font-medium">${Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {/* Inline stock adjustment */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAdjustStockInline(product.barcode, -1)}
                        className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 transition"
                      >
                        -
                      </button>
                      <span className="font-semibold w-8 text-center">{product.stock}</span>
                      <button
                        onClick={() => handleAdjustStockInline(product.barcode, 1)}
                        className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 transition"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.stock < 3 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-850 transition"
                        onClick={() => handleOpenPrintLabel(product)}
                      >
                        Print QR
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-rose-950 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/50 transition border-opacity-40"
                        onClick={() => handleDeleteProduct(product.barcode, product.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  No matching products cataloged in system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default InventoryCatalog;
