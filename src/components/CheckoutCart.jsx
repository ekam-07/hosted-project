import React from 'react';

function CheckoutCart({
  activeBill,
  handleClearBill,
  handleUpdateBillItemQty,
  handleRemoveBillItem,
  subtotal,
  tax,
  total,
  onGenerateInvoice
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-md sm:p-6 h-full flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-semibold">Active Transaction</h2>
            <p className="text-sm text-slate-400">Checkout items rung up this session.</p>
          </div>
          <button
            onClick={handleClearBill}
            disabled={activeBill.length === 0}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-900 transition"
          >
            Clear Bill
          </button>
        </div>

        {/* Items Checkout List */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {activeBill.length > 0 ? (
            activeBill.map((item) => (
              <div key={item.barcode} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm truncate text-slate-100">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 block font-mono">BC: {item.barcode}</span>
                  <span className="text-xs font-medium text-emerald-400">${item.price.toFixed(2)} each</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Qty adjustments */}
                  <div className="flex items-center border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
                    <button
                      onClick={() => handleUpdateBillItemQty(item.barcode, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold transition"
                    >
                      -
                    </button>
                    <span className="px-2.5 text-xs font-semibold text-slate-100">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateBillItemQty(item.barcode, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold transition"
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveBillItem(item.barcode)}
                    className="text-slate-500 hover:text-rose-400 font-bold text-base transition px-1"
                    title="Remove item"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              <span className="text-3xl block mb-2">🛒</span>
              <p>Active receipt is empty.</p>
              <p className="text-xs text-slate-600 mt-1">Scan items in checkout mode to ring up a bill.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bill Totals & Proceed buttons */}
      <div className="border-t border-slate-800 pt-4 mt-6 space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Sales Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-slate-100 border-t border-slate-800 pt-2">
            <span>Transaction Total</span>
            <span className="text-emerald-400">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onGenerateInvoice}
          disabled={activeBill.length === 0}
          className="w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/10 disabled:opacity-50 disabled:pointer-events-none active:translate-y-[1px]"
        >
          Generate Invoice & Receipt
        </button>
      </div>
    </section>
  );
}

export default CheckoutCart;
