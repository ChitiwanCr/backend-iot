const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

//jwt setup
const jwt = require('jsonwebtoken');
const accessTokenSecret = process.env.accessDeviceTokenSecret || '3c3b3bf3b58ce5e86b670c44b05ed77c';
const refreshTokenSecret = process.env.refreshDeivceTokenSecret || '7aa0b26c238900d5de592d37832bb02e';
const accExpire = '1h';

const DeviceSchema = new mongoose.Schema(
  {
    macaddress: { type: String, unique: true, required: [true, "can't be blank"], index: true },
    devicename: { type: String, required: [true, "can't be blank"] },
    type: { type: String },
    version: { type: String },
    software: { type: String },
    reftoken: { type: String },
    onetimetoken: { type: Number, default: 1 },
    projectowner: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: [true, "can't be blank"], index: true },
    role: { type: String, default: 'device' },
    header: { type: Object },
    fixactivity: { type: Number, default: -1 },
  },
  { timestamps: true }
);
DeviceSchema.plugin(uniqueValidator, { message: 'is already taken.' });

DeviceSchema.pre('save', async function(next) {
  var device = this;
  // only hash the password if it has been modified (or is new)
  if (!device.isModified('macaddress')) return next();
  try {
    this.reftoken = await this.generateRefJWT();
    next();
  } catch (err) {
    return next(err);
  }
});

DeviceSchema.methods.generateJWT = async function() {
  return new Promise((res, rej) => {
    jwt.sign(
      { id: this._id, role: this.role, macaddress: this.macaddress, projectowner: this.projectowner },
      accessTokenSecret,
      { expiresIn: accExpire },
      function(err, token) {
        if (err) {
          rej(err);
        }
        res(token);
      }
    );
  });
};

DeviceSchema.methods.generateRefJWT = async function() {
  return new Promise((res, rej) => {
    jwt.sign({ id: this._id }, refreshTokenSecret, function(err, reftoken) {
      if (err) {
        rej(err);
      }
      res(reftoken);
    });
  });
};

DeviceSchema.methods.toJSON = function() {
  return {
    macaddress: this.macaddress,
    devicename: this.devicename,
    type: this.type,
    version: this.version,
    software: this.software,
    refreshtoken: this.refreshtoken,
    onetimetoken: this.onetimetoken,
  };
};

mongoose.model('Device', DeviceSchema);
