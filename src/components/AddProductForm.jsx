import React from 'react';

function AddProductForm({ form, handleChange, handleAddProduct }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Add new product</h2>
          <p className="text-sm text-slate-400">Barcode is required to save a product.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleAddProduct}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Product name</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none ring-0"
              name="name"
              placeholder="e.g. Hand Soap"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Selling price</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none ring-0"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="4.99"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Starting stock</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none ring-0"
              name="stock"
              type="number"
              min="0"
              placeholder="10"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Barcode</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none ring-0"
              name="barcode"
              placeholder="Auto-generated if blank"
              value={form.barcode}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-2 block text-slate-300">Details</span>
          <textarea
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none ring-0"
            name="details"
            rows="3"
            placeholder="Extra product details for the owner"
            value={form.details}
            onChange={handleChange}
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 cursor-pointer"
        >
          Save product
        </button>
      </form>
    </section>
  );
}

export default AddProductForm;
