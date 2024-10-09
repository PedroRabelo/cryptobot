const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');

router.get('/balance', exchangeController.getBalance);

router.get('/coins', exchangeController.getCoins);

module.exports = router;
