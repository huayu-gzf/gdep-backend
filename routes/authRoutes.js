const express = require('express');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// 注册路由 - 无需认证
router.post('/register', registerUser);

// 登录路由 - 无需认证
router.post('/login', loginUser);

// 获取当前用户信息 - 需要认证
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;