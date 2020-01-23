const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/users', require('./v1/userRouter'));
router.use('/albums', require('./v1/albumRouter'));
router.use('/tracks', require('./v1/trackRouter'));

module.exports = router;
