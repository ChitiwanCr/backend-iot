const router = require('express').Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const auth = require('../auth');

//check Permission
const checkPermission = function(req, res, next) {
  try {
    if (req.user.id !== req.jwtpayload.id) {
      throw new Error('Permission denied');
    }
    next();
  } catch (err) {
    err.status = 403;
    next(err);
  }
};

// Preload article objects on routes with ':username'
router.param('username', async function(req, res, next, username) {
  try {
    const user = await User.findOne({ username: username });
    if (!user) throw new Error('Not Found');
    req.user = user;
    next();
  } catch (err) {
    err.status = 404;
    next(err);
  }
});

router.get('/:username', auth.userrequired, checkPermission, async (req, res, next) => {
  try {
    return res.json({ user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
});

router.put('/:username', auth.userrequired, checkPermission, async (req, res, next) => {
  const { username, email, password, first_name, last_name } = req.body;
  try {
    const user = req.user;
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password;
    if (first_name) user.first_name = first_name;
    if (last_name) user.password = last_name;

    await user.save();
    return res.json({ user: user.toJSON() });
  } catch (err) {
    err.status = 403;
    next(err);
  }
});

router.use('/:username/projects', require('./projects'));

module.exports = router;
