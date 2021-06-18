const mongoose = require('mongoose');
const moment = require('moment');

const TimeseriesSchema = new mongoose.Schema({
  header: { type: Object },
  deviceowner: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: [true, "can't be blank"], index: true },
  data: [
    {
      type: Object,
    },
  ],
  start: {
    type: Date,
    default: moment()
      .startOf('day')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
    index: true,
  },
  end: {
    type: Date,
    default: moment()
      .endOf('day')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
    index: true,
  },
});

mongoose.model('Timeseries', TimeseriesSchema);
