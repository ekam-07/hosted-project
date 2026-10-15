import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toDataURL } from 'qrcode';
import { useBill } from './context/BillContext.jsx';

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

const CATEGORIES = [
  { value: 'ac', label: 'AC' },
  { value: 'fridge', label: 'Fridge' },
  { value: 'washing_machine', label: 'Washing Machine' },
  { value: 'microwave', label: 'Microwave' },
  { value: 'filter', label: 'Filter' },
];

const emptyForm = {
  name: '',
  price: '',
  costPrice: '',
  stock: '',
  barcode: '',
  details: '',
  category: 'ac',
};

// ── Bill Page ──

function Home() {
  const { billItems, setBillItems } = useBill();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('Scan a product barcode or add a new one.');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Press start scan to use your camera.');
  const [savedQrUrl, setSavedQrUrl] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [printProduct, setPrintProduct] = useState(null);
  const [printQrUrl, setPrintQrUrl] = useState('');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Clear bill for new customer ──
  const handleClearBill = () => {
    setBillItems([]);
    setMessage('Bill cleared. Ready for next customer.');
  };

  // ── Fetch products ──
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Unable to load products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── Scanner ──
  const handleScan = async (barcode) => {
    const trimmedBarcode = String(barcode || '').trim();
    if (!trimmedBarcode) return setMessage('Scanned code is invalid. Please try again.');

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: trimmedBarcode, action: 'details' }),
      });
      const result = await response.json();
      if (!response.ok || !result.found) return setMessage(result.message || 'No matching product found for that code.');
      setScanResult(result);
      setMessage(`Scanned ${result.name}. Choose Sell or Details.`);
    } catch (error) {
      console.error(error);
      setMessage('Scanning could not be completed right now.');
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try { await scannerRef.current.stop(); } catch { /* already stopped */ }
    try { await scannerRef.current.clear(); } catch { /* already cleared */ }
    scannerRef.current = null;
  };

  useEffect(() => {
    if (!isScanning) {
      stopScanner();
      setScannerStatus('Press start scan to use your camera.');
      return undefined;
    }

    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;
    Html5Qrcode.getCameras()
      .then(async (devices) => {
        const backCamera = devices.find((device) => /back|rear|environment/i.test(device.label));
        await scanner.start(
          backCamera ? { deviceId: { exact: backCamera.id } } : { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: { width: 150, height: 150 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A,
            ],
          },
          async (decodedText) => {
            await stopScanner();
            setIsScanning(false);
            handleScan(decodedText);
          },
          () => setScannerStatus('Scanning… keep the barcode inside the frame.'),
        );
      })
      .catch((error) => {
        console.error(error);
        setScannerStatus('Camera permission denied or unavailable.');
        setIsScanning(false);
      });

    return () => { stopScanner(); };
  }, [isScanning]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const generateBarcode = () =>
    `SKU-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const handleAddProduct = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      stock: Number(form.stock),
      barcode: form.barcode.trim() || generateBarcode(),
      details: form.details.trim(),
      category: form.category,
    };
    try {
      const response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.text()) || 'Product could not be saved');
      const savedProduct = await response.json();
      setProducts((previous) => [...previous, savedProduct]);
      setForm(emptyForm);
      setMessage(`Added ${savedProduct.name}. Barcode: ${savedProduct.barcode}`);
      setSavedQrUrl(await toDataURL(savedProduct.barcode));
    } catch (error) {
      console.error(error);
      setMessage('Product save failed. Please try again.');
      setSavedQrUrl('');
    }
  };

  const handleSellProduct = async () => {
    if (!scanResult?.barcode) return;
    const quantity = Number(sellQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > scanResult.stock) {
      setMessage('Please choose a valid quantity within the available stock.');
      return;
    }
    try {
      const response = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode: scanResult.barcode, action: 'sell', quantity }) });
      const result = await response.json();
      if (!response.ok) return setMessage(result.message || 'Unable to sell this product.');
      setProducts((previous) => previous.map((product) => product.barcode === result.barcode ? { ...product, stock: result.stock } : product));
      setScanResult((previous) => ({ ...previous, ...result }));
      setBillItems((previous) => {
        const existingIndex = previous.findIndex((item) => item.barcode === result.barcode);
        if (existingIndex < 0) return [...previous, { barcode: result.barcode, name: result.name, price: result.price, quantity }];
        return previous.map((item, index) => index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item);
      });
      setSellQuantity(1);
      setMessage(`Sold ${quantity} unit${quantity > 1 ? 's' : ''} of ${result.name}. Remaining: ${result.stock}`);
    } catch (error) {
      console.error(error);
      setMessage('Could not complete the sale.');
    }
  };

  const handleShowDetails = async () => {
    if (!scanResult?.barcode) return;
    try {
      const response = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode: scanResult.barcode, action: 'details' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setScanResult(result);
      setPrintProduct(result);
      setMessage(`Details loaded for ${result.name}.`);
    } catch {
      setMessage('Could not load details.');
    }
  };

  const handleStopScan = () => {
    stopScanner();
    setIsScanning(false);
    setScanResult(null);
    setScannerStatus('Scanner stopped.');
  };

  const handleOpenPrintLabel = (product) => setPrintProduct(product);

  useEffect(() => {
    if (!printProduct) return setPrintQrUrl('');
    toDataURL(printProduct.barcode).then(setPrintQrUrl).catch(() => setPrintQrUrl(''));
  }, [printProduct]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const scanner = new Html5Qrcode('file-reader');
    try {
      await handleScan(await scanner.scanFile(file, true));
    } catch {
      setMessage('Unable to decode a barcode from that image.');
    } finally {
      event.target.value = '';
      scanner.clear().catch(() => {});
    }
  };

  return (
            <div className="min-h-screen bg-slate-950 text-slate-100">
              <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <header className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">Inventory scanner</p>
                  <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Fast barcode-based stock control for your shop</h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                    Scan a product, see its selling price, reduce stock by one, and get an alert when items are running low.
                  </p>
                </header>

                {/* Two-column: Add product + Scanner */}
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

                  {/* Add product form */}
                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold">Add new product</h2>
                      <p className="text-sm text-slate-400">Barcode auto-generated if left blank.</p>
                    </div>
                    <form className="space-y-4" onSubmit={handleAddProduct}>
                      {/* Row 1: Name + Category */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-2 block text-slate-300">Product name</span>
                          <input
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            name="name" placeholder="e.g. Samsung AC" value={form.name} onChange={handleChange} required
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-2 block text-slate-300">Category</span>
                          <select
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500 text-slate-100"
                            name="category" value={form.category} onChange={handleChange} required
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {/* Row 2: Selling price + Cost price */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-2 block text-slate-300">Selling price</span>
                          <input
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            name="price" type="number" min="0" step="0.01" placeholder="4.99" value={form.price} onChange={handleChange} required
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-2 block text-slate-300">Cost price <span className="text-slate-500 text-xs">(admin only)</span></span>
                          <input
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            name="costPrice" type="number" min="0" step="0.01" placeholder="2.50" value={form.costPrice} onChange={handleChange} required
                          />
                        </label>
                      </div>
                      {/* Row 3: Stock + Barcode */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-2 block text-slate-300">Starting stock</span>
                          <input
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            name="stock" type="number" min="0" placeholder="10" value={form.stock} onChange={handleChange} required
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-2 block text-slate-300">Barcode</span>
                          <input
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            name="barcode" placeholder="Auto-generated if blank" value={form.barcode} onChange={handleChange}
                          />
                        </label>
                      </div>
                      <label className="block text-sm">
                        <span className="mb-2 block text-slate-300">Details</span>
                        <textarea
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          name="details" rows="3" placeholder="Extra product details for the owner" value={form.details} onChange={handleChange}
                        />
                      </label>
                      <button type="submit" className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 cursor-pointer">
                        Save product
                      </button>
                    </form>
                    {savedQrUrl && (
                      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-slate-950/50 p-4 border border-slate-800">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Newly Generated Barcode Label</span>
                        <img className="h-40 w-40 rounded-2xl border border-slate-700 bg-white p-2" src={savedQrUrl} alt="Product QR code" />
                      </div>
                    )}
                  </section>

                  {/* Barcode scanner */}
                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">Barcode scanner</h2>
                        <p className="text-sm text-slate-400">Works on mobile and desktop cameras.</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="rounded-2xl border border-emerald-500/40 px-3 py-2 text-sm font-semibold text-emerald-400 cursor-pointer"
                          onClick={() => (isScanning ? handleStopScan() : setIsScanning(true))}
                          type="button"
                        >
                          {isScanning ? 'Stop scan' : 'Start scan'}
                        </button>
                        <button
                          className="rounded-2xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 cursor-pointer"
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Upload QR image
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </div>
                    </div>

                    {/* Search product by name */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search product by name..."
                        value={homeSearchQuery}
                        onChange={(e) => setHomeSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 text-slate-100 placeholder:text-slate-500"
                      />
                    </div>

                    {homeSearchQuery.trim() && (
                      <div className="mb-4 max-h-60 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-3 space-y-2">
                        {products.filter(p => p.name.toLowerCase().includes(homeSearchQuery.toLowerCase())).length === 0 ? (
                          <p className="text-xs text-slate-500 p-1">No matches found.</p>
                        ) : (
                          products.filter(p => p.name.toLowerCase().includes(homeSearchQuery.toLowerCase())).map(p => (
                            <div
                              key={p.barcode}
                              onClick={() => {
                                setScanResult(p);
                                setHomeSearchQuery('');
                              }}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-800 cursor-pointer transition"
                            >
                              <div className="flex items-center gap-3">
                                <QrCodeImage barcode={p.barcode} className="h-10 w-10 bg-white p-0.5 rounded border border-slate-700 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-white">{p.name}</p>
                                  <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-emerald-400">₹{Number(p.price).toFixed(2)}</p>
                                <p className="text-xs text-slate-500">Stock: {p.stock}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Camera viewfinder */}
                    {isScanning ? (
                      <div className="relative min-h-[280px] rounded-2xl bg-slate-950/80 overflow-hidden">
                        <div id="reader" className="absolute inset-0 h-full w-full" />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="h-[220px] w-[220px] rounded-3xl border-4 border-emerald-400/70 bg-slate-950/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
                        </div>
                        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-3 py-1 text-xs text-slate-100 shadow-lg">
                          Align the barcode inside the square frame
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[200px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-slate-400 flex items-center justify-center text-sm">
                        {scanResult ? (
                          <p className="text-emerald-300">Product scanned — see results below.</p>
                        ) : (
                          <p>Camera is off. Press <span className="text-emerald-400">Start scan</span> to open the camera.</p>
                        )}
                      </div>
                    )}

                    {/* Hidden file-reader div */}
                    <div id="file-reader" className="hidden" />

                    {/* Status + scan result */}
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                      <p>{scannerStatus}</p>
                      <p className="mt-1 text-slate-300">{message}</p>
                    </div>

                    {scanResult && (
                      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/90 p-4 text-slate-100">
                        <h3 className="text-base font-semibold">Scanned product</h3>
                        <p className="mt-2 text-slate-300">Name: <span className="text-white">{scanResult.name}</span></p>
                        <p className="text-slate-300">Barcode: <span className="text-white">{scanResult.barcode}</span></p>
                        <p className="text-slate-300">Price: <span className="text-emerald-400 font-semibold">₹{Number(scanResult.price).toFixed(2)}</span></p>
                        <p className="text-slate-300">Stock: <span className={scanResult.stock < 3 ? 'text-amber-400 font-semibold' : 'text-white'}>{scanResult.stock}</span></p>
                        <div className="mt-3 flex flex-wrap gap-3 items-center">
                          <label className="flex items-center gap-2 text-sm text-slate-300">
                            <span>Qty</span>
                            <input
                              type="number"
                              min="1"
                              max={scanResult.stock}
                              value={sellQuantity}
                              placeholder="Enter quantity"
                              onChange={(e) => {
                                const value = e.target.value;
                              
                                if (value === "") {
                                  setSellQuantity("");
                                  return;
                                }
                              
                                const num = Math.max(
                                  1,
                                  Math.min(Number(value), scanResult.stock)
                                );
                              
                                setSellQuantity(num);
                              }}
                            />
                          </label>
                          <button className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 cursor-pointer" onClick={handleSellProduct} type="button">Sell</button>
                          <button className="rounded-2xl border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-100 cursor-pointer" onClick={handleShowDetails} type="button">Details</button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* ── Running Bill ── */}
                <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Current bill</h2>
                      <p className="text-sm text-slate-400">Items accumulate here as you scan and sell. Clear when starting a new customer.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleClearBill}
                        className="rounded-2xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 cursor-pointer hover:bg-red-500/10 transition"
                      >
                        Clear bill
                      </button>
                      {billItems.length > 0 ? (
                        <Link
                          to="/bill"
                          className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Generate Bill
                        </Link>
                      ) : (
                        <span className="rounded-2xl bg-emerald-500/40 px-4 py-2 text-sm font-semibold text-slate-950/60 cursor-not-allowed">
                          Generate Bill
                        </span>
                      )}
                    </div>
                  </div>

                  {billItems.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-8 text-center text-sm text-slate-500">
                      No items yet — scan a product and press <span className="text-emerald-400">Sell</span> to add it here.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                          <thead>
                            <tr className="text-slate-400">
                              <th className="px-3 py-3 font-medium">Product</th>
                              <th className="px-3 py-3 font-medium">Unit price</th>
                              <th className="px-3 py-3 font-medium">Qty</th>
                              <th className="px-3 py-3 font-medium text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {billItems.map((item) => (
                              <tr key={item.barcode} className="text-slate-200">
                                <td className="px-3 py-3">{item.name}</td>
                                <td className="px-3 py-3">₹{Number(item.price).toFixed(2)}</td>
                                <td className="px-3 py-3">{item.quantity}</td>
                                <td className="px-3 py-3 text-right font-semibold text-emerald-400">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                        {(() => {
                          const sub = billItems.reduce((s, i) => s + i.price * i.quantity, 0);
                          const tx = sub * 0.08;
                          return (
                            <>
                              <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span><span>₹{sub.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Tax (8%)</span><span>₹{tx.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-bold text-white">
                                <span>Total</span><span>₹{(sub + tx).toFixed(2)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </section>
                <Link to={'/admin'}><button type='button'>Admin</button></Link>

                {/* Stock overview table */}
                <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Stock overview</h2>
                    <p className="text-sm text-slate-400">Low stock alerts appear automatically when a product is scanned.</p>
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
                        {products.filter((p) => p.stock < 3).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-3 py-6 text-center text-slate-500">No products with low stock (less than 3).</td>
                          </tr>
                        ) : (
                          products.filter((p) => p.stock < 3).map((product) => (
                            <tr key={product.barcode} className="text-slate-200">
                              <td className="px-3 py-3">{product.name}</td>
                              <td className="px-3 py-3 font-mono text-xs text-slate-400">{product.barcode}</td>
                              <td className="px-3 py-3">₹{Number(product.price).toFixed(2)}</td>
                              <td className="px-3 py-3">{product.stock}</td>
                              <td className="px-3 py-3">
                                <span className="text-amber-400 font-medium">Low stock</span>
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Print label modal */}
                {printProduct && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
                    <div className="w-full max-w-3xl rounded-3xl bg-slate-900/95 p-6 text-slate-100 shadow-2xl shadow-black/50">
                      <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold">Print barcode label</h2>
                          <p className="text-sm text-slate-400">Cancel returns you to the main screen.</p>
                        </div>
                        <button type="button" className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold cursor-pointer" onClick={() => setPrintProduct(null)}>Cancel</button>
                      </div>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-6">
                          <h3 className="text-lg font-semibold">{printProduct.name}</h3>
                          <p className="mt-3 text-slate-400">Price: ₹{Number(printProduct.price).toFixed(2)}</p>
                          <p className="mt-1 text-slate-400">Stock: {printProduct.stock}</p>
                          <p className="mt-3">{printProduct.details || 'No extra details.'}</p>
                        </div>
                        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-950/90 p-6">
                          {printQrUrl ? (
                            <img className="h-64 w-64 rounded-3xl bg-white p-4" src={printQrUrl} alt="Product QR code" />
                          ) : (
                            <div className="flex h-64 w-64 items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 text-sm text-slate-400">Generating QR…</div>
                          )}
                          <button type="button" className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer" onClick={() => { window.print(); setPrintProduct(null); }}>
                            Print now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
  );
}

export default Home;

