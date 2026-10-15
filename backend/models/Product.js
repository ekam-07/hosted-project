import mongoose from 'mongoose';

export const CATEGORIES = ['ac', 'fridge', 'washing_machine', 'microwave', 'filter'];

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0, default: 0 },
  stock: { type: Number, required: true, min: 0 },
  barcode: { type: String, required: true, unique: true },
  details: { type: String, default: '' },
  category: { type: String, enum: CATEGORIES, required: true },
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
