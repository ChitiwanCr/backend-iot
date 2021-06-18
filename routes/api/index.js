const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/device', require('./device'));
router.use('/', require('./profile'));

router.use(function(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function(errors, key) {
        //errors[key] = err.errors[key].message;
        errors.push({ source: err.errors[key].path, message: err.errors[key].path + ' ' + err.errors[key].message });
        return errors;
      }, []),
    });
  }
  next(err);
});

module.exports = router;
