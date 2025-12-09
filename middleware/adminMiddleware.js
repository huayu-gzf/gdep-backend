const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 验证管理员权限中间件
 * 确保只有角色为admin的用户才能访问特定接口
 */
const verifyAdmin = async (req, res, next) => {
  console.log('=================== 开始验证管理员权限 ===================');
  console.log(`请求路径: ${req.path}`);
  
  try {
    // 从请求头获取token
    const authHeader = req.header('Authorization');
    console.log('Authorization请求头:', authHeader ? '存在' : '不存在');
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('提取的token:', token ? `${token.substring(0, 10)}...` : '无');
    
    if (!token) {
      console.error('验证失败: 未提供认证令牌');
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    // 验证token
    console.log('开始验证token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'student_welcome_system_secret_key_2024');
    console.log('Token验证成功，解码信息:', { userId: decoded.id });
    
    // 查找用户
    console.log(`根据ID查找用户: ${decoded.id}`);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.error(`验证失败: 用户不存在 - ID: ${decoded.id}`);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    console.log(`找到用户: ${user.username}, 角色: ${user.role}`);
    
    // 检查用户角色是否为管理员
    if (user.role !== 'admin') {
      console.error(`验证失败: 用户不是管理员 - ${user.username}, 角色: ${user.role}`);
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      });
    }
    
    console.log(`验证通过: ${user.username} 是管理员`);
    
    // 将用户信息附加到请求对象上
    req.user = user;
    console.log('=================== 管理员权限验证通过 ===================');
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

module.exports = verifyAdmin;