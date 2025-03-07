const express = require('express');

const { check }=require('express-validator');

const authController = require('../controllers/auth');


const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signup', check('email').isEmail(),authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

module.exports = router;