const redis = require('redis');
const logger = require('./logger');

const LOGS = process.env.CACHE_LOGS === 'true';

module.exports = class Cache {

  constructor() {
    this.client = redis.createClient(process.env.CACHE_URL);

    this.client.on("error", (error) => {
      logger('system', error);
    })
    logger('system', 'Redis started!');
  }

  async get(key) {
    return JSON.parse(await this.client.get(key));
  }

  async getAll(...keys) {
    let values = await this.client.mGet(keys);
    const obj = {};
    keys.map((k, i) => obj[k] = JSON.parse(values[i]));
    return obj;
  }

  async set(key, value, notify = true, expireInSeconds = 0) {
    if (LOGS) logger('system', 'SET ' + JSON.stringify({ key, value }));

    if (expireInSeconds)
      await this.client.set(key, JSON.stringify(value), 'EX', expireInSeconds);
    else
      await this.client.set(key, JSON.stringify(value));

    if (notify)
      console.log('avisar beholder');
  }

  unset(key) {
    if (LOGS) logger('system', 'DEL ' + key);
    return this.client.del(key);
  }

  async search(pattern) {
    const keys = await this.client.keys(pattern || '*');
    return this.getAll(...keys);
  }
}