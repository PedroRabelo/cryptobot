const express = require('express');
const router = express.Router();
const symbolsController = require('../controllers/symbolsController');

router.get('/', symbolsController.getSymbols);

router.get('/:symbol', symbolsController.getSymbol);

router.patch('/:symbol', symbolsController.updateSymbol);

router.get('/:sync', symbolsController.syncSymbols);

module.exports = router;