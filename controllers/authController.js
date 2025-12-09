const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

// 用户注册
const registerUser = async (req, res) => {
  try {
    const { username, password, name, role = 'student' } = req.body;

    // 检查用户名是否已存在
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      name,
      role
    });

    // 生成JWT令牌
    const token = generateToken(user._id);

    // 返回用户信息和令牌（不返回密码）
    res.status(201).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
};

// 用户登录
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户（包含密码字段）
    const user = await User.findOne({ username }).select('+password');
    
    // 检查用户是否存在以及密码是否正确
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成JWT令牌
    const token = generateToken(user._id);

    // 返回用户信息和令牌
    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    // req.user是通过中间件添加的当前用户信息
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};