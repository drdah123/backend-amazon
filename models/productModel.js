import mongoose from 'mongoose';

const reviewsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
});

const productShecma = new mongoose.Schema(
  {
    name: { type: String, uniqe: true, required: true },
    slug: { type: String, uniqe: true, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    countInStock: { type: Number, required: true },
    brand: { type: String, required: true },
    numReviews: { type: Number, required: true },
    rating: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviews: [reviewsSchema],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productShecma);

export default Product;
