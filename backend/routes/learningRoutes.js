const express = require('express');
const router = express.Router();
const { searchVideos, getVideoDetails } = require('../controllers/learningController');

router.get('/search', searchVideos);
router.get('/video/:videoId', getVideoDetails);

module.exports = router;
