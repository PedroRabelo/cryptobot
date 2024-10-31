const express = require('express');
const router = express.Router();
const symbolsController = require('../controllers/symbolsController');
const profileMiddleware = require('../middlewares/profileMiddleware');

router.post('/sync', profileMiddleware, symbolsController.syncSymbols);

router.get('/:symbol', symbolsController.getSymbol);

router.patch('/:symbol', profileMiddleware, symbolsController.updateSymbol);

router.get('/', symbolsController.getSymbols);

module.exports = router;