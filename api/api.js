
const express = require('express');

const api = express.Router();

api.use('/twitter', require('./twitter'));

module.exports = api;
