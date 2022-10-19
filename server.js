import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedRouter from './routes/seedRoutes.js';
import productRouter from './routes/productRoutes.js';
import userRouter from './routes/userRoutes.js';
import orderRouter from './routes/orederRoutes.js';
import cors from 'cors';
import uploadRouter from './routes/uploadRoute.js';

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('connected to mongoDB'))
  .catch((e) => console.log(e.message));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/keys/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});

app.get('/api/keys/google', (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || '' });
});

app.use('/api/seed', seedRouter);
app.use('/api/products', productRouter);
app.use('/api/users', userRouter);
app.use('/api/orders', orderRouter);
app.use('/api/upload', uploadRouter);

const __dirname = path.resolve();

// app.use(express.static(path.join(__dirname, '/frontend/build')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '/frontend/build/index.html'));
// });
app.get('/', (req, res) => {
  res.send('hello world');
});

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log('its running on 5000'));
