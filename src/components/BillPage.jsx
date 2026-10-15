import React from 'react';
import { useNavigate } from 'react-router-dom';
import Bill from '../bill.jsx';

function BillPage({ scanResult, sellQuantity }) {
  const navigate = useNavigate();
  
  // Create receipt item array based on last scan & selected sell quantity
  const items = scanResult ? [{
    name: scanResult.name,
    price: scanResult.price,
    quantity: sellQuantity
  }] : [];
  
  const subtotal = scanResult ? scanResult.price * sellQuantity : 0;
  const tax = subtotal * 0.08; // 8% sales tax
  const total = subtotal + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center no-print">
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 cursor-pointer hover:bg-slate-800 transition"
        >
          ← Back to Scanner
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 cursor-pointer hover:bg-emerald-400 transition"
        >
          Print Invoice
        </button>
      </div>

      <div className="print-target">
        <Bill
          businessName="Inventory Shop"
          customerName="Walk-in Customer"
          invoiceNumber={`INV-${Date.now().toString().slice(-6)}`}
          items={items}
          subtotal={subtotal}
          tax={tax}
          total={total}
        />
      </div>
    </div>
  );
}

export default BillPage;
