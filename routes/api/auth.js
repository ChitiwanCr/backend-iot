const router = require('express').Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const auth = require('../auth');

//login
router.post('/login', async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    if (!username && !email) {
      throw new Error("username or email can't be blank");
    }
    if (!password) {
      throw new Error("password can't be blank");
    }
  } catch (err) {
    err.status = 422;
    return next(err);
  }

  //username login
  if (username) {
    try {
      const user = await User.findOne({ username: username });
      if (!user || !(await user.comparePassword(password))) {
        throw new Error('useranme or password is invalid');
      }
      const token = await user.generateJWT();
      const reftoken = await user.generateRefJWT();
      return res.status(200).json({ accessToken: token, refreshToken: reftoken });
    } catch (err) {
      err.status = 422;
      return next(err);
    }
  } else {
    //email login
    try {
      const user = await User.findOne({ email: email });
      if (!user || !(await user.comparePassword(password))) {
        throw new Error('useranme or password is invalid');
      }
      const token = await user.generateJWT();
      const reftoken = await user.generateRefJWT();
      return res.status(200).json({ accessToken: token, refreshToken: reftoken });
    } catch (err) {
      err.status = 422;
      next(err);
    }
  }
});

//register
router.post('/register', async (req, res, next) => {
  const { username, password, email, first_name, last_name } = req.body;
  var user = new User({ username, password, email, first_name, last_name });
  try {
    await user.save();
    return res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

//request new token
router.post('/reftoken', auth.userreftoken, async (req, res, next) => {
  try {
    const user = await User.findById(req.jwtpayload.id);
    const jwt = await user.generateJWT();
    return res.status(200).json({ accessToken: jwt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
