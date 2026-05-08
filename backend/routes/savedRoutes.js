const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { toggleSaved, getSaved, checkSaved } = require('../controllers/savedController');

router.get('/', isAuthenticated, getSaved);
router.post('/toggle', isAuthenticated, toggleSaved);
router.get('/check/:id', isAuthenticated, checkSaved);

module.exports = router;
