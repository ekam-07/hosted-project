import React from 'react';

function PrintLabelModal({ printProduct, printQrUrl, onClose }) {
  if (!printProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900/95 p-6 text-slate-100 shadow-2xl shadow-black/50">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Print barcode label</h2>
            <p className="text-sm text-slate-400">Cancel returns you to the main screen.</p>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-6">
              <h3 className="text-lg font-semibold">{printProduct.name}</h3>
              <p className="mt-3 text-slate-400">Price: ${Number(printProduct.price).toFixed(2)}</p>
              <p className="mt-1 text-slate-400">Stock: {printProduct.stock}</p>
              <p className="mt-3 text-slate-100">{printProduct.details || 'No extra details.'}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-950/90 p-6">
            {printQrUrl ? (
              <img className="h-64 w-64 rounded-3xl bg-white p-4" src={printQrUrl} alt="Product QR code" />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 text-sm text-slate-400">
                Generating QR...
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              onClick={() => {
                window.print();
                onClose();
              }}
            >
              Print now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintLabelModal;
