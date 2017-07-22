
const express = require('express');

const api = express.Router();

// GET /gallery
api.use(require('./gallery'));

module.exports = api;
