const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');

// JWT认证中间件
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 检查token是否存在
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 验证token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: '无效或过期的令牌' });
    }

    // 根据解码的用户ID查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: '认证失败', error: error.message });
  }
};

// 管理员权限中间件
const adminMiddleware = (req, res, next) => {
  try {
    // 检查用户是否存在且角色为admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限访问此资源' });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: '权限验证失败', error: error.message });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};