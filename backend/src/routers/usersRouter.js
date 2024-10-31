const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.delete('/:id', usersController.deleteUser);

//router.get('/active', usersController.getActiveUsers);

router.get('/:search?', usersController.getUsers);

router.patch('/:id', usersController.updateUser);

router.post('/', usersController.insertUser);

router.post('/:id/start', usersController.startUser);

router.post('/:id/stop', usersController.stopUser);

router.post('/:id/reset', usersController.resetUserPassword);

module.exports = router;