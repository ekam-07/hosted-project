import React from 'react';

function ScannerSection({
  isScanning,
  setIsScanning,
  handleStopScan,
  fileInputRef,
  handleFileUpload,
  scanResult,
  scannerStatus,
  message,
  sellQuantity,
  setSellQuantity,
  handleSellProduct,
  handleBill,
  handleShowDetails,
  savedQrUrl
}) {
  return (
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      <div className={isScanning ? 'relative min-h-[280px] rounded-2xl bg-slate-950/80 overflow-hidden' : 'min-h-[260px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-slate-400'}>
        {isScanning ? (
          <div className="relative min-h-[280px]">
            <div id="reader" className="absolute inset-0 h-full w-full" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[160px] w-[160px] rounded-3xl border-4 border-emerald-400/70 bg-slate-950/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
            </div>
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-3 py-1 text-xs text-slate-100 shadow-lg shadow-black/40">
              Align the QR code inside the square frame
            </div>
          </div>
        ) : scanResult ? (
          <div>
            <p className="text-sm text-emerald-300">Ready for action on scanned product.</p>
          </div>
        ) : (
          <p className="text-sm">Camera is stopped. Press Start scan to open the camera.</p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
        <p>{scannerStatus}</p>
        <p>{message}</p>
        {scanResult ? (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/90 p-4 text-slate-100">
            <h3 className="text-base font-semibold">Scanned product</h3>
            <p className="mt-2">Name: {scanResult.name}</p>
            <p>Barcode: {scanResult.barcode}</p>
            <p>Price: ${Number(scanResult.price).toFixed(2)}</p>
            <p>Stock: {scanResult.stock}</p>
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <span>Qty</span>
                <input
                  type="number"
                  min="1"
                  max={scanResult.stock}
                  value={sellQuantity}
                  onChange={(event) => {
                    const rawValue = Number(event.target.value);
                    const safeValue = Number.isInteger(rawValue)
                      ? rawValue
                      : Math.max(1, Math.floor(rawValue || 1));
                    setSellQuantity(Number.isNaN(safeValue) ? 1 : Math.max(1, Math.min(safeValue, scanResult.stock)));
                  }}
                  className="w-20 rounded-xl border border-slate-700 bg-slate-950/90 px-2 py-1 text-sm text-slate-100 outline-none focus:border-emerald-400"
                />
              </label>
              <button
                className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 cursor-pointer"
                onClick={handleSellProduct}
                type="button"
              >
                Sell
              </button>
              <button
                className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 cursor-pointer"
                onClick={handleBill}
                type="button"
              >
                Generate Bill
              </button>
              <button
                className="rounded-2xl border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-100 cursor-pointer"
                onClick={handleShowDetails}
                type="button"
              >
                Details
              </button>
            </div>
          </div>
        ) : null}
        {savedQrUrl ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-slate-950/80 p-4 text-slate-100">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Last saved product QR</span>
            <img className="h-40 w-40 rounded-2xl border border-slate-700 bg-white p-2" src={savedQrUrl} alt="Saved product QR code" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ScannerSection;
