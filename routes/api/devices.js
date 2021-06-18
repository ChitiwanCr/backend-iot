const router = require('express').Router();
const mongoose = require('mongoose');
const Device = mongoose.model('Device');
const Timeseries = mongoose.model('Timeseries');
const auth = require('../auth');
const moment = require('moment-timezone');
const { asyncGet, asyncSet } = require('../../redis');

router.param('devicename', async function(req, res, next, devicename) {
  try {
    const device = await Device.findOne({ projectowner: req.project, devicename: devicename });
    if (!device) throw new Error('Not Found');
    req.device = device;
    next();
  } catch (err) {
    err.status = 404;
    next(err);
  }
});

router.get('/', auth.userrequired, async (req, res, next) => {
  try {
    const devices = await Device.find({ projectowner: req.project.id })
      .select({ macaddredd: 1, devicename: 1, type: 1, version: 1, software: 1, _id: 0 })
      .lean();
    return res.status(200).json({ devices: devices });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth.userrequired, async (req, res, next) => {
  const { macaddress, devicename, type, version, software, header } = req.body;
  try {
    if (await Device.findOne({ projectowner: req.project, devicename }).exec()) {
      throw new Error('devicename is already taken.');
    }
    const devices = new Device({ macaddress, devicename, type, version, software, projectowner: req.project, header });
    await devices.save();
    return res.status(201).json({ devices: devices.toJSON() });
  } catch (err) {
    err.status = 422;
    next(err);
  }
});

router.get('/:devicename', auth.userrequired, async (req, res) => {
  return res.status(200).json({ devices: req.device.toJSON() });
});

router.get('/:devicename/data', auth.userrequired, async (req, res, next) => {
  const { start, end, header } = req.query;
  let query = { deviceowner: req.device };
  try {
    if (header) {
      query.header = req.device.header;
    }
    if (start && end) {
      query.start = { $gte: start, $lte: end };
    }
    const timeseries = await Timeseries.find(query)
      .select({ _id: 0 })
      .lean();

    return res.status(200).json({
      timeseries,
    });
  } catch (err) {
    next(err);
  }
});

//TODO
//fix user Permission
router.get('/:devicename/lastdata', auth.userrequired, async (req, res, next) => {
  const { start, end, header } = req.query;
  let query = { deviceowner: req.device };
  if (header) {
    query.header = req.device.header;
  }
  if (start && end) {
    query.start = { $gte: start, $lte: end };
  }

  try {
    const cached = await asyncGet(req.device.macaddress);
    if (cached) {
      let lastdata = JSON.parse(cached);

      return res.status(200).json({ success: true, lastdata });
    }
    const data = await Timeseries.findOne(query)
      .sort('-start')
      .limit(1)
      .lean();
    if (!data) return res.status(200).json({ sccess: true, lastdata: 'empty' });
    const temp = data.data.pop();

    return res.status(200).json({
      sccess: true,
      lastdata: temp,
      len: data.data.length,
    });
  } catch (err) {
    next(err);
  }
});

//TODO
//fix user Permission
router.post('/:devicename/data', auth.userrequired, async (req, res, next) => {
  const { data } = req.body;
  // add timestam payload
  try {
    if (!data) {
      let err = new Error("data can't be blank");
      err.status = 422;
      throw err;
    }
    data.timestam = moment()
      .tz('asia/bangkok')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    await Timeseries.findOneAndUpdate(
      {
        deviceowner: req.device,
        start: moment()
          .tz('asia/bangkok')
          .startOf('day')
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        header: req.device.header,
      },
      {
        $push: { data: data },
      },
      { upsert: true }
    );
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
