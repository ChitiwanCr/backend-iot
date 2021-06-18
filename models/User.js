var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

//jwt setup
const jwt = require('jsonwebtoken');
const accessTokenSecret = process.env.accessTokenSecret || '0f64c2308f6b1dc579a5c330ddd65b35';
const refreshTokenSecret = process.env.refreshTokenSecret || '75f2be5e6944997e6cb8c70faa4c4046';
const accExpire = '1y';

//bcrypt setup
const bcrypt = require('bcrypt');
const saltRounds = 10;

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
    email: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true },
    first_name: { type: String, match: [/^[a-zA-Z]+$/, 'is invalid'] },
    last_name: { type: String, match: [/^[a-zA-Z]+$/, 'is invalid'] },
    password: {
      type: String,
      minlength: [6, 'is too short'],
      required: [true, "can't be blank"],
    },
  },
  { timestamps: true }
);
UserSchema.plugin(uniqueValidator, { message: 'is already taken.' });

UserSchema.pre('save', async function(next) {
  var user = this;
  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = async function(password) {
  const result = await bcrypt.compare(password, this.password);
  return result;
};

UserSchema.methods.generateJWT = async function() {
  return new Promise((res, rej) => {
    jwt.sign({ id: this._id, username: this.username, role: 'user' }, accessTokenSecret, { expiresIn: accExpire }, function(err, token) {
      if (err) {
        rej(err);
      }
      res(token);
    });
  });
};

UserSchema.methods.generateRefJWT = async function() {
  return new Promise((res, rej) => {
    jwt.sign({ id: this._id, username: this.username, role: 'user' }, refreshTokenSecret, function(err, reftoken) {
      if (err) {
        rej(err);
      }
      res(reftoken);
    });
  });
};

UserSchema.methods.toJSON = function() {
  return {
    username: this.username,
    email: this.email,
    first_name: this.first_name,
    last_name: this.last_name,
  };
};

mongoose.model('User', UserSchema);
