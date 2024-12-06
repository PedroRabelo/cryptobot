const express = require('express');
const router = express.Router();
const beholderController = require('../controllers/beholderController');
const profileMiddleware = require('../middlewares/profileMiddleware');

router.get('/memory/indexes', beholderController.getMemoryIndexes);

router.get('/memory/:symbol?/:index?/:interval?', beholderController.getMemory);

router.get('/analysis', beholderController.getAnalysisIndexes);

router.get('/brain/indexes', profileMiddleware, beholderController.getBrainIndexes);

router.get('/brain', profileMiddleware, beholderController.getBrain);

router.get('/agenda', profileMiddleware, beholderController.getAgenda);

router.get('/streams', profileMiddleware, beholderController.getStreams);

router.post('/init', profileMiddleware, beholderController.init);

module.exports = router;
