import React from 'react';
import Bill from '../bill.jsx';

function BillModal({ showBillModal, activeBill, subtotal, tax, total, onClose, onPrintSuccess }) {
  if (!showBillModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 no-print">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 text-slate-100 shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold">Checkout Receipt Invoice</h2>
          <button
            type="button"
            className="text-2xl text-slate-400 hover:text-white"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        {/* Scrollable Receipt Body designated as the print target */}
        <div className="print-target overflow-y-auto flex-1 pr-1">
          <Bill
            businessName="Antigravity Shop Control"
            customerName="Walk-in Shop Customer"
            invoiceNumber={`INV-${Date.now().toString().slice(-6)}`}
            items={activeBill}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        </div>

        <div className="mt-4 flex gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-slate-700 py-3 text-sm font-semibold hover:bg-slate-850 text-slate-200 transition"
            onClick={onClose}
          >
            Back to Checkout
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
            onClick={() => {
              window.print();
              onPrintSuccess();
            }}
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillModal;
