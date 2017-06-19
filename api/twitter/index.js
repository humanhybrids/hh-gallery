
const express = require('express');
const router = express.Router();
const client = require('./client');

router.get("/", function (req, res) {
    client.get('application/rate_limit_status', { }).then(data => res.json(data));
});

module.exports = router;
