const router = require('express').Router();
const mongoose = require('mongoose');
const Device = mongoose.model('Device');
const Timeseries = mongoose.model('Timeseries');
const auth = require('../auth');
const moment = require('moment-timezone');
const { asyncGet, asyncSet } = require('../../redis');

router.param('macaddress', async function(req, res, next, macaddress) {
  try {
    const device = await Device.findOne({ macaddress });
    if (!device) throw new Error('Not Found');
    req.device = device;
    next();
  } catch (err) {
    err.status = 404;
    next(err);
  }
});

router.post('/getottoken/:macaddress', auth.deviceoptional, async (req, res, next) => {
  try {
    const device = req.device;
    if (device.onetimetoken) {
      device.onetimetoken = 0;
      await device.save();
      return res.status(200).json({ refToken: device.reftoken });
    } else {
      throw new Error('onetimetoken already get token');
    }
  } catch (err) {
    err.status = 422;
    next(err);
  }
});

router.post('/reftoken', auth.devicereftoken, async (req, res, next) => {
  try {
    const device = await Device.findById(req.jwtpayload.id);
    const jwt = await device.generateJWT();
    return res.status(200).json({ accessToken: jwt });
  } catch (err) {
    next(err);
  }
});

router.get('/:macaddress', auth.devicerequired, async (req, res, next) => {
  try {
    if (req.params.macaddress !== req.jwtpayload.macaddress) {
      if (req.jwtpayload.role !== 'superdevice') {
        let err = new Error('Permission denied');
        err.status = 403;
        throw err;
      }
      if (req.jwtpayload.projectowner !== req.device.projectowner.toString()) {
        let err = new Error('Permission denied');
        err.status = 403;
        throw err;
      }
    }
    return res.status(200).json({ device: req.device.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.post('/:macaddresss', auth.devicerequired, async (req, res, next) => {
  try {
    if (req.params.macaddresss !== req.jwtpayload.macaddress) {
      if (req.jwtpayload.role !== 'superdevice') {
        let err = new Error('Permission denied');
        err.status = 403;
        throw err;
      }
    }

    const { data } = req.body;
    if (!data) {
      let err = new Error("data can't be blank");
      err.status = 422;
      throw err;
    }

    const cached = await asyncGet(req.params.macaddresss);
    if (cached === JSON.stringify(req.body.data)) {
      await asyncSet(req.params.macaddresss, JSON.stringify(req.body.data), 'EX', 900);
      return res.status(200).json({ success: true, detail: 'equal in cached' });
    }

    const device = await Device.findOne({ macaddress: req.params.macaddresss });
    if (!device) {
      let err = new Error('Not Found');
      err.status = 404;
      throw err;
    }
    await asyncSet(device.macaddress, JSON.stringify(req.body.data), 'EX', 900);
    data.timestam = moment()
      .tz('asia/bangkok')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    await Timeseries.findOneAndUpdate(
      {
        deviceowner: device,
        start: moment()
          .tz('asia/bangkok')
          .startOf('day')
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        header: device.header,
      },
      {
        $push: { data: data },
      },
      { upsert: true }
    );
    return res.status(200).json({ success: true, detail: 'insert data success to database' });
  } catch (error) {
    next(error);
  }
});

// router.get('/device/:deviceid', auth.deviceoruser, async (req, res, next) => {
//   const { deviceid } = req.params;
//   if (deviceid !== req.jwtpayload.id) {

//   }

//   return res.status(200).json({ test: 'test' });
// });

module.exports = router;
