import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toDataURL } from 'qrcode';

// Helper component to render QR Code inline
function QrCodeImage({ barcode, className }) {
  const [qrUrl, setQrUrl] = useState('');
  useEffect(() => {
    if (barcode) {
      toDataURL(barcode)
        .then(url => setQrUrl(url))
        .catch(() => setQrUrl(''));
    }
  }, [barcode]);

  if (!qrUrl) return <div className="w-10 h-10 bg-slate-800 animate-pulse rounded" />;
  return <img src={qrUrl} alt="QR Code" className={className} />;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  ac: 'AC',
  fridge: 'Fridge',
  washing_machine: 'Washing Machine',
  microwave: 'Microwave',
  filter: 'Filter',
};

const CATEGORY_COLORS = {
  ac: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  fridge: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  washing_machine: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  microwave: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  filter: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

const CATEGORIES = Object.entries(CATEGORY_LABELS);

const formatToday = () => new Date().toISOString().slice(0, 10);

// ─── EditModal ────────────────────────────────────────────────────────────────
function EditModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name:      product.name,
    price:     product.price,
    costPrice: product.costPrice,
    stock:     product.stock,
    category:  product.category,
    details:   product.details || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.barcode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:      form.name,
          price:     Number(form.price),
          costPrice: Number(form.costPrice),
          stock:     Number(form.stock),
          category:  form.category,
          details:   form.details,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.message || 'Save failed.');
        setSaving(false);
        return;
      }
      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch {
      setErr('Network error. Please try again.');
    }
    setSaving(false);
  };

  const inputCls = 'w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors text-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-amber-500/20 bg-slate-900 p-6 shadow-2xl shadow-black/60">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Product</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{product.barcode}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer transition">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-400">Product name</span>
              <input className={inputCls} name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-400">Category</span>
              <select className={inputCls} name="category" value={form.category} onChange={handleChange} required>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-400">Selling price (₹)</span>
              <input className={inputCls} type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-amber-400/80 font-medium">Cost price (₹)</span>
              <input className={inputCls + ' border-amber-500/30'} type="number" min="0" step="0.01" name="costPrice" value={form.costPrice} onChange={handleChange} required />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-400">Stock</span>
            <input className={inputCls} type="number" min="0" name="stock" value={form.stock} onChange={handleChange} required />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-400">Details</span>
            <textarea className={inputCls} rows="3" name="details" value={form.details} onChange={handleChange} />
          </label>

          {err && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}

          <button type="submit" disabled={saving}
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition cursor-pointer disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── AdminPage ────────────────────────────────────────────────────────────────
function AdminPage() {
  const [authToken, setAuthToken]   = useState('');
  const [password, setPassword]     = useState('');
  const [products, setProducts]     = useState(null);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [editProduct, setEditProduct] = useState(null);
  const [saleDate, setSaleDate]     = useState(formatToday);
  const [dailySales, setDailySales] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState('');

  // Scanner state
  const [isScanning, setIsScanning]     = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Press Scan to use camera.');
  const [scanResult, setScanResult]     = useState(null);
  const scannerRef = useRef(null);

  const loadDailySales = async (date = saleDate, token = authToken) => {
    setSalesLoading(true);
    setSalesError('');
    try {
      const res = await fetch(`/api/admin/sales?date=${encodeURIComponent(date)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to load sales for this date.');
      }
      setDailySales(await res.json());
    } catch (err) {
      setDailySales(null);
      setSalesError(err.message || 'Unable to load sales for this date.');
    } finally {
      setSalesLoading(false);
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 403) { setError('Access denied: your IP is not on the admin allowlist.'); setLoading(false); return; }
      if (res.status === 401) { setError('Incorrect admin password. Please try again.'); setLoading(false); return; }
      if (!res.ok) { setError('Server error. Please try again.'); setLoading(false); return; }
      const data = await res.json();
      setAuthToken(password);
      setProducts(data);
      await loadDailySales(saleDate, password);
    } catch {
      setError('Unable to connect to server.');
    }
    setLoading(false);
  };

  // ── Reload products ────────────────────────────────────────────────────────
  const reloadProducts = async (token) => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token || authToken}` },
      });
      if (res.ok) setProducts(await res.json());
    } catch { /* ignore */ }
  };

  // ── Scanner ────────────────────────────────────────────────────────────────
  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try { await scannerRef.current.stop(); } catch { /* ignore */ }
    try { await scannerRef.current.clear(); } catch { /* ignore */ }
    scannerRef.current = null;
  };

  useEffect(() => {
    if (!isScanning) {
      stopScanner();
      setScannerStatus('Press Scan to use camera.');
      return;
    }

    const scanner = new Html5Qrcode('admin-reader');
    scannerRef.current = scanner;

    Html5Qrcode.getCameras().then(async (devices) => {
      const norm = (l) => String(l || '').toLowerCase();
      const find = (t) => devices?.find((d) => norm(d.label).includes(t));
      const cam = find('back') || find('rear') || find('environment') || devices?.[0];

      const configs = [
        cam ? { deviceId: { exact: cam.id } } : undefined,
        { facingMode: 'environment' },
        { facingMode: { ideal: 'environment' } },
        undefined,
      ];

      setScannerStatus('Waiting for camera permission…');

      for (const cfg of configs) {
        try {
          await scanner.start(
            cfg,
            {
              fps: 30,
              qrbox: { width: 150, height: 150 },
              disableFlip: false,
              videoConstraints: {
                width: { ideal: 1280 }, height: { ideal: 720 },
                facingMode: { ideal: 'environment' },
                focusMode: 'continuous',
                advanced: [{ focusMode: 'continuous' }],
              },
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.UPC_A,
              ],
            },
            async (decodedText) => {
              setScannerStatus('Barcode detected. Loading…');
              try { await scanner.stop(); } catch { /* ignore */ }
              try { await scanner.clear(); } catch { /* ignore */ }
              scannerRef.current = null;
              setIsScanning(false);
              handleScanResult(decodedText);
            },
            () => setScannerStatus('Scanning… hold barcode inside the frame.')
          );
          return;
        } catch (err) {
          console.warn('Camera config failed:', err?.message);
        }
      }
      setScannerStatus('Unable to start camera.');
      setIsScanning(false);
    }).catch(() => {
      setScannerStatus('Camera permission denied.');
      setIsScanning(false);
    });

    return () => { stopScanner(); };
  }, [isScanning]);

  // ── Handle scan result (admin — fetches full details via admin endpoint) ───
  const handleScanResult = async (barcode) => {
    const b = String(barcode || '').trim();
    if (!b) { setScannerStatus('Invalid barcode.'); return; }
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) { setScannerStatus('Could not load product data.'); return; }
      const all = await res.json();
      const found = all.find((p) => p.barcode === b);
      if (!found) { setScannerStatus(`No product found for barcode: ${b}`); setScanResult(null); return; }
      setScanResult(found);
      setScannerStatus('Product found!');
    } catch {
      setScannerStatus('Network error while loading product.');
    }
  };

  // ── Edit save ──────────────────────────────────────────────────────────────
  const handleSave = (updated) => {
    setProducts((prev) => prev.map((p) => p.barcode === updated.barcode ? { ...p, ...updated } : p));
    // also update scanResult if it's the same product
    if (scanResult && scanResult.barcode === updated.barcode) {
      setScanResult((prev) => ({ ...prev, ...updated }));
    }
    reloadProducts();
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = (products || []).filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalValue  = filtered.reduce((s, p) => s + p.price * p.stock, 0);
  const totalCost   = filtered.reduce((s, p) => s + (p.costPrice || 0) * p.stock, 0);
  const totalMargin = totalValue - totalCost;

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!products) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 mb-4">
              <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="mt-1 text-sm text-slate-400">Enter your admin password to access the panel</p>
          </div>
          <form onSubmit={handleLogin} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl space-y-4">
            <label className="block text-sm">
              <span className="mb-2 block text-slate-300 font-medium">Admin Password</span>
              <input
                id="admin-password-input"
                type="password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
                placeholder="Enter password…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoFocus
              />
            </label>
            {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
            <button id="admin-login-btn" type="submit" disabled={loading}
              className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition cursor-pointer disabled:opacity-50">
              {loading ? 'Authenticating…' : 'Access Admin Panel'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-300 transition">← Back to main app</Link>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN PANEL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {editProduct && (
        <EditModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={handleSave}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* ── Header ── */}
        <header className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-950/40 to-slate-900/70 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Admin Panel</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Full Product Inventory</h1>
              <p className="text-sm text-slate-400 mt-1">All fields including cost price, margins, and edit access.</p>
            </div>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setProducts(null); setAuthToken(''); setPassword(''); setError(''); setScanResult(null); setIsScanning(false); }}
                className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer">
                Sign out
              </button>
              <Link to="/" className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">
                ← Main App
              </Link>
            </div>
          </div>
        </header>

        {/* ── Summary cards ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Revenue Value', value: `₹${totalValue.toFixed(2)}`, sub: `${filtered.length} products shown`, color: 'text-emerald-400' },
            { label: 'Cost Value', value: `₹${totalCost.toFixed(2)}`, sub: 'Cost of current stock', color: 'text-sky-400' },
            { label: 'Gross Margin', value: `₹${totalMargin.toFixed(2)}`, sub: totalValue > 0 ? `${((totalMargin / totalValue) * 100).toFixed(1)}% margin` : '—', color: totalMargin >= 0 ? 'text-amber-400' : 'text-red-400' },
          ].map((c) => (
            <div key={c.label} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider">{c.label}</p>
              <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Scanner section ── */}
        <section className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Daily sales</h2>
              <p className="text-sm text-slate-400">Search any day’s completed sales. Records are retained for at least one year.</p>
            </div>
            <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); loadDailySales(); }}>
              <label className="block text-sm text-slate-300">
                <span className="mb-1 block">Sale date</span>
                <input type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} max={formatToday()} className="rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </label>
              <button type="submit" disabled={salesLoading} className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50">
                {salesLoading ? 'Loading…' : 'Search sales'}
              </button>
            </form>
          </div>

          {salesError && <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{salesError}</p>}

          {dailySales && (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Revenue', value: `₹${dailySales.summary.revenue.toFixed(2)}`, color: 'text-emerald-400' },
                  { label: 'Items sold', value: dailySales.summary.quantity, color: 'text-sky-400' },
                  { label: 'Transactions', value: dailySales.summary.transactions, color: 'text-amber-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">{item.label}</p>
                    <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Barcode</th>
                      <th className="px-4 py-3 font-medium text-right">Unit price</th>
                      <th className="px-4 py-3 font-medium text-right">Quantity</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {dailySales.sales.length === 0 ? (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No sales were recorded on this date.</td></tr>
                    ) : dailySales.sales.map((sale) => (
                      <tr key={sale._id} className="text-slate-200">
                        <td className="px-4 py-3 text-slate-400">{new Date(sale.soldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 font-medium text-white">{sale.productName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{sale.barcode}</td>
                        <td className="px-4 py-3 text-right">₹{Number(sale.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{sale.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">₹{Number(sale.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Scanner</h2>
              <p className="text-sm text-slate-400">Scan any barcode to instantly view and edit full product details.</p>
            </div>
            <button
              type="button"
              onClick={() => { setScanResult(null); setIsScanning((v) => !v); }}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold cursor-pointer transition ${isScanning ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'}`}
            >
              {isScanning ? '⏹ Stop scan' : '📷 Start scan'}
            </button>
          </div>

          {/* Viewfinder */}
          {isScanning ? (
            <div className="relative min-h-[280px] rounded-2xl bg-slate-950/80 overflow-hidden">
              <div id="admin-reader" className="absolute inset-0 h-full w-full" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[160px] w-[160px] rounded-3xl border-4 border-amber-400/70 bg-slate-950/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
              </div>
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-3 py-1 text-xs text-slate-100">
                Align the barcode inside the frame
              </div>
            </div>
          ) : (
            <div className="min-h-[80px] rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm text-slate-400 flex items-center justify-center">
              {scanResult ? <span className="text-amber-400">Product loaded — see details below.</span> : 'Camera off. Press Start scan.'}
            </div>
          )}

          {/* Scanner status */}
          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {scannerStatus}
          </div>

          {/* Scan result card */}
          {scanResult && (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-slate-950/80 p-5 text-slate-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{scanResult.name}</h3>
                  <span className={`inline-block rounded-xl border px-2.5 py-0.5 text-xs font-semibold mt-1 ${CATEGORY_COLORS[scanResult.category] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                    {CATEGORY_LABELS[scanResult.category] || scanResult.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditProduct(scanResult)}
                  className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition cursor-pointer shrink-0"
                >
                  ✏️ Edit
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: 'Barcode', value: scanResult.barcode, cls: 'font-mono text-xs text-slate-400' },
                  { label: 'Sell Price', value: `₹${Number(scanResult.price).toFixed(2)}`, cls: 'text-emerald-400 font-bold' },
                  { label: 'Cost Price', value: `₹${Number(scanResult.costPrice || 0).toFixed(2)}`, cls: 'text-amber-400 font-bold' },
                  { label: 'Margin', value: (() => { const m = scanResult.price - (scanResult.costPrice || 0); return `₹${m.toFixed(2)} (${scanResult.price > 0 ? ((m / scanResult.price) * 100).toFixed(1) : 0}%)`; })(), cls: (scanResult.price - (scanResult.costPrice || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Stock', value: scanResult.stock, cls: scanResult.stock < 3 ? 'text-amber-400 font-bold' : 'text-white' },
                  { label: 'Details', value: scanResult.details || '—', cls: 'text-slate-400' },
                ].map((row) => (
                  <div key={row.label} className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3">
                    <p className="text-xs text-slate-500 mb-1">{row.label}</p>
                    <p className={row.cls}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Search + Filter bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by product name or barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">✕</button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {[['all', 'All'], ...CATEGORIES].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilterCat(val)}
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold cursor-pointer transition ${
                  filterCat === val
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Products Table ── */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
              <thead className="bg-slate-950/60">
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-4 font-medium">Product</th>
                  <th className="px-4 py-4 font-medium">QR Code</th>
                  <th className="px-4 py-4 font-medium">Category</th>
                  <th className="px-4 py-4 font-medium">Barcode</th>
                  <th className="px-4 py-4 font-medium">Sell Price</th>
                  <th className="px-4 py-4 font-medium text-amber-400">Cost Price</th>
                  <th className="px-4 py-4 font-medium text-amber-400">Margin</th>
                  <th className="px-4 py-4 font-medium">Stock</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Details</th>
                  <th className="px-4 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 && (
                  <tr><td colSpan="11" className="px-4 py-10 text-center text-slate-500">No products match your search or filter.</td></tr>
                )}
                {filtered.map((p) => {
                  const margin    = p.price - (p.costPrice || 0);
                  const marginPct = p.price > 0 ? ((margin / p.price) * 100).toFixed(1) : '0.0';
                  const catColor  = CATEGORY_COLORS[p.category] || 'text-slate-400 bg-slate-800 border-slate-700';
                  return (
                    <tr key={p.barcode} className="text-slate-200 hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3">
                        <QrCodeImage barcode={p.barcode} className="h-10 w-10 bg-white p-0.5 rounded border border-slate-700" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-xl border px-2.5 py-0.5 text-xs font-semibold ${catColor}`}>
                          {CATEGORY_LABELS[p.category] || p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.barcode}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">₹{Number(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-amber-400 font-semibold">₹{Number(p.costPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          ₹{margin.toFixed(2)} <span className="text-xs text-slate-400">({marginPct}%)</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        {p.stock === 0
                          ? <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-2 py-0.5">Out of stock</span>
                          : p.stock < 3
                          ? <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2 py-0.5">Low stock</span>
                          : <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2 py-0.5">Healthy</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[180px] truncate text-xs">{p.details || '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setEditProduct(p)}
                          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

export default AdminPage;
