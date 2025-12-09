const jwt = require('jsonwebtoken');
require('dotenv').config();

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } // 设置默认过期时间为1小时
  );
};

// 验证JWT令牌
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null; // 验证失败返回null
  }
};

module.exports = {
  generateToken,
  verifyToken
};