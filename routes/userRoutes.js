import express from 'express';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import generateToken, { isAuth } from '../utils.js';
import expressAsyncHandler from 'express-async-handler';

const userRouter = express.Router();

userRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

userRouter.get(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === user.isAdmin.true) {
        res.status(400).send({ message: 'Can Not Delete Admin User' });
        return;
      }
      await user.remove();
      res.send({ message: 'User Deleted' });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

userRouter.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    const existed = await User.findOne({ email: req.body.email });
    if (existed) {
      return res.status(300).send({ message: 'it is already token email ' });
    }
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
    });
    const user = await newUser.save();
    res.send({
      _id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  })
);
userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const isUniqe = await User.findOne({
      email: req.body.email,
    });
    if (isUniqe && isUniqe.email !== user.email)
      return res.status(300).send({ message: 'it is already token email ' });
    //if (!user) return res.status(404).send({ message: 'User not found' });
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 8);
    }
    const updatedUser = await user.updateOne({
      email: req.body.email || user.email,
      name: req.body.name || user.name,
      password: req.body.password || user.password,
    });
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
    {
      /*if(user){
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email,
      if(req.body.password){
        user.password = bcrypt.hashSync(req.body.password, 8)
      }
      const updatedUser = await user.save()
      res.send({
        _id: upatedUser._id,
        name: updatedUser.name,
        email:updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      })
    }*/
    }
  })
);

export default userRouter;
