import express from 'express';
import data from '../data.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

const seedRouter = express.Router();

seedRouter.get('/', async (req, res) => {
  const createdUsers = await User.find();
  const ceatedProducts = await Product.find();
  res.send({ ceatedProducts, createdUsers });
});

export default seedRouter;
