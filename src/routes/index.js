const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const AnalysisController = require('../controllers/AnalysisController');
const auth = require('../middlewares/auth');


// 认证路由
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

// 分析路由 (需要认证)
router.get('/auth/user', auth, AuthController.getUserInfo);
router.get('/analysis/:stockCode', AnalysisController.getAnalysis);
router.post('/analysis/:stockCode', auth, AnalysisController.saveAnalysis);
router.get('/analysis/:stockCode/check-update', auth, AnalysisController.checkUpdate);

module.exports = router;