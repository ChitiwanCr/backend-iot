//express setup
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

require('dotenv').config();
//check producting
const isProduction = process.env.NODE_ENV === 'production';

//config prodcution
if (isProduction) {
  const compression = require('compression');
  app.use(compression());
  const helmet = require('helmet');
  app.use(helmet());
}

// DB stuff
if (isProduction) {
  mongoose
    .connect('mongodb://mongo:27017/iot', {
      auth: {
        authSource: 'admin',
      },
      user: process.env.MONGODB_USERNAME ,
      pass: process.env.MONGODB_PASSWORD ,
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  mongoose.connect('mongodb://localhost/iot').catch((err) => {
    console.log(err);
  });
  mongoose.set('debug', true);
  mongoose.set('useFindAndModify', false);
}
require('./models/User');
require('./models/Device');
require('./models/Project');
require('./models/Timeseries');

//setup cors
app.use(cors());

//setup router
app.use(require('./routes'));

app.get('/', (req, res) => {
  res.send('Hello World');
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// dev error handler
if (!isProduction) {
  // eslint-disable-next-line no-unused-vars
  app.use(function(err, req, res, next) {
    console.log(err.stack);
    //console.log('end log err stack');
    res.status(err.status || 500);
    res.json({
      errors: [
        {
          message: err.message,
          error: { err },
        },
      ],
    });
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  // eslint-disable-next-line no-unused-vars
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: {},
      },
    });
  });
}

app.listen(process.env.PORT || 3000, () => {
  console.log('server start at port 3000');
});
