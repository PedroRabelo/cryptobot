const express = require('express');
const router = express.Router();
const beholderController = require('../controllers/beholderController');

router.get('/memory/indexes', beholderController.getMemoryIndexes);

router.get('/memory/:symbol?/:index?/:interval?', beholderController.getMemory);

router.get('/brain/indexes', beholderController.getBrainIndexes);

router.get('/brain', beholderController.getBrain);

router.get('/analysis', beholderController.getAnalysisIndexes);

router.get('/agenda', beholderController.getAgenda);

module.exports = router;
