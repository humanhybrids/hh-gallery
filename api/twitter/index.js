
const express = require('express');
const client = require('./client');

const router = express.Router();

router.get('/', (req, res) => {
  client.get('application/rate_limit_status', {
  }).then((data) => {
    res.json(data);
  }).catch((err) => {
    res.status(500).json({ error: err });
  });
});

module.exports = router;
