const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 定义用户Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    select: false // 查询时默认不返回密码字段
  },
  name: {
    type: String,
    required: [true, '姓名不能为空'],
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  major: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

// 密码加密中间件：保存前自动加密密码
userSchema.pre('save', async function(next) {
  // 只有密码被修改时才加密
  if (!this.isModified('password')) return next();
  
  try {
    // 加密密码，强度为10
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// 自定义方法：验证密码
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 创建User模型
const User = mongoose.model('User', userSchema);

module.exports = User;