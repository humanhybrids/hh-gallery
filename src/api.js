const express = require('express');

const api = express.Router();

api.use(require('./gallery'));

module.exports = api;
