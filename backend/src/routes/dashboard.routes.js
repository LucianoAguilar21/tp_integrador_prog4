const { Router } = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const authMiddleware      = require('../middlewares/auth.middleware');

const router = Router();
router.use(authMiddleware);

router.get('/', DashboardController.index);

module.exports = router;