//redis
const isProduction = process.env.NODE_ENV === 'production';
let host;
if (isProduction) {
  host = process.env.REDIS_URI;
} else {
  host = '127.0.0.1';
}
const redis = require('redis');
const { promisify } = require('util');
const client = redis.createClient({ host: host });
const asyncGet = promisify(client.get).bind(client);
const asyncSet = promisify(client.set).bind(client);
const asyncDel = promisify(client.set).bind(client);

client
  .on('connect', function() {
    console.log('redis connected');
  })
  .on('error', function(error) {
    console.log(error);
  });

module.exports = { asyncGet, asyncSet, asyncDel };
