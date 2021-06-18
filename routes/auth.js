const jwt = require('express-jwt');
const accessTokenSecret = process.env.accessTokenSecret || '0f64c2308f6b1dc579a5c330ddd65b35';
const refreshTokenSecret = process.env.refreshTokenSecret || '75f2be5e6944997e6cb8c70faa4c4046';
const accessDeviceTokenSecret = process.env.accessDeviceTokenSecret || '3c3b3bf3b58ce5e86b670c44b05ed77c';
const refreshDeviceTokenSecret = process.env.refreshDeivceTokenSecret || '7aa0b26c238900d5de592d37832bb02e';

function getTokenFromHeader(req) {
  if (
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}
const auth = {
  userrequired: jwt({
    secret: accessTokenSecret,
    algorithms: ['HS256'],
    userProperty: 'jwtpayload',
    getToken: getTokenFromHeader,
  }),
  useroptional: jwt({
    secret: accessTokenSecret,
    algorithms: ['HS256'],
    userProperty: 'jwtpayload',
    credentialsRequired: false,
    getToken: getTokenFromHeader,
  }),
  userreftoken: jwt({
    secret: refreshTokenSecret,
    algorithms: ['HS256'],
    userProperty: 'jwtpayload',
    getToken: getTokenFromHeader,
  }),
  devicerequired: jwt({
    secret: accessDeviceTokenSecret,
    algorithms: ['HS256'],
    userProperty: 'jwtpayload',
    getToken: getTokenFromHeader,
  }),
  devicereftoken: jwt({
    secret: refreshDeviceTokenSecret,
    algorithms: ['HS256'],
    userProperty: 'jwtpayload',
    getToken: getTokenFromHeader,
  }),
  deviceoptional: jwt({
    secret: accessDeviceTokenSecret,
    algorithms: ['HS256'],
    userProperty: 'jwtpayload',
    credentialsRequired: false,
    getToken: getTokenFromHeader,
  }),
};

module.exports = auth;
