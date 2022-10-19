import express from 'express';
import Product from '../models/productModel.js';
import expressAsyncHndler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';
import e from 'express';
import User from '../models/userModel.js';

const productRouter = express.Router();

productRouter.get('/', async (req, res) => {
  const product = await Product.find();
  res.send(product);
});

productRouter.get(
  '/categories',
  expressAsyncHndler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
  })
);

const PAGE_SIZE = 3;

productRouter.get(
  '/search',
  expressAsyncHndler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};

    const categoryFilter = category && category !== 'all' ? { category } : {};

    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};

    const priceFilter =
      price && price !== 'all'
        ? {
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};

    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHndler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    console.log(product);
    console.log(JSON.stringify(product.user) === JSON.stringify(req.user._id));

    if (!product) return res.status(404).send({ message: 'Product not found' });

    if (
      product.user &&
      JSON.stringify(product.user) !== JSON.stringify(req.user._id)
    )
      return res
        .status(300)
        .send({ message: 'you dont have access to this product' });

    product.name = req.body.name;
    product.slug = req.body.slug;
    product.price = req.body.price;
    product.category = req.body.category;
    product.description = req.body.description;
    product.countInStock = req.body.countInStock;
    product.brand = req.body.brand;
    product.image = req.body.image;

    product.user = req.user._id;

    await product.save();

    res.status(200).send({ message: 'Product update successfully' });
  })
);

productRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHndler(async (req, res) => {
    const newProduct = new Product({
      name: req.body.name,
      slug: req.body.slug,
      image: '/images/p1.jpg',
      price: req.body.price,
      category: req.body.category,
      brand: req.body.brand,
      countInStock: req.body.countInStock,
      rating: 0,
      numReviews: 0,
      description: req.body.description,
      user: req.user._id,
    });
    const product = await newProduct.save();
    if (product) {
      res.status(200).send({
        message: 'created successfully',
        product,
      });
    } else {
      res.status(500).send({ message: 'somthing went wrong' });
    }
  })
);

productRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHndler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const products = await Product.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    const countProducts = await Product.countDocuments();

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/categories',
  expressAsyncHndler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
  })
);

productRouter.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});
productRouter.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

productRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHndler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.send({ message: 'Product Deleted' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

productRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHndler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;
      const updatedProduct = await product.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
        rating: product.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

export default productRouter;
