import React from 'react';

function Bill({
  businessName = 'Inventory Shop',
  customerName = 'Customer',
  invoiceNumber = 'INV-001',
  date = new Date().toLocaleDateString(),
  items = [],
  subtotal = 0,
  tax = 0,
  total = 0,
}) {
  const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-8 text-slate-100 shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{businessName}</h1>
          <p className="mt-2 text-sm text-slate-400">Sales Receipt</p>
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>Invoice #{invoiceNumber}</p>
          <p>{date}</p>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Bill To</p>
          <p className="font-medium">{customerName}</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={`${item.name || 'item'}-${index}`} className="border-t border-slate-800">
                  <td className="px-4 py-3">{item.name || 'Item'}</td>
                  <td className="px-4 py-3">{item.quantity || 1}</td>
                  <td className="px-4 py-3">{formatCurrency(item.price || 0)}</td>
                  <td className="px-4 py-3">{formatCurrency((item.quantity || 1) * (item.price || 0))}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-400" colSpan="4">
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-semibold text-white">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-700 pt-4 text-center text-xs text-slate-500">
        <p>Thank you for your purchase.</p>
      </div>
    </div>
  );
}

export default Bill;
