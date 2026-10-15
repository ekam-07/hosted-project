import { useState } from 'react';
import { RouterProvider, createBrowserRouter, useNavigate } from 'react-router-dom';
import Bill from './bill.jsx';
import Home from './Home.jsx';
import AdminPage from './components/AdminPage.jsx';
import { BillProvider, useBill } from './context/BillContext.jsx';
import './App.css';

function BillPage() {
  const navigate = useNavigate();
  const { billItems } = useBill();
  const [invoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-6)}`);
  const subtotal = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between no-print">
          <button type="button" onClick={() => navigate('/')} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition">Back to Scanner</button>
          <button type="button" onClick={() => window.print()} className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition">Print Invoice</button>
        </div>
        <div className="print-target">
          <Bill businessName="Inventory Shop" customerName="Walk-in Customer" invoiceNumber={invoiceNumber} items={billItems} subtotal={subtotal} tax={tax} total={subtotal + tax} />
        </div>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/bill', element: <BillPage /> },
  { path: '/admin', element: <AdminPage /> },
]);

function App() {
  return <BillProvider><RouterProvider router={router} /></BillProvider>;
}

export default App;

