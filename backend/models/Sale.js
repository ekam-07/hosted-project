import mongoose from 'mongoose';

const DEFAULT_RETENTION_DAYS = 370;

function expiryDate() {
  const retentionDays = Number(process.env.SALE_RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);
  return expiresAt;
}

const saleSchema = new mongoose.Schema({
  barcode: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true, min: 0 },
  soldAt: { type: Date, required: true, default: Date.now },
  saleDate: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, default: expiryDate, expires: 0 },
}, { versionKey: false });

saleSchema.index({ saleDate: 1, soldAt: -1 });

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);

export default Sale;
