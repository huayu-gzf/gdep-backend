const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// 导入路由
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

// 加载环境变量
dotenv.config();

// 创建Express应用实例
const app = express();

// 配置中间件
app.use(cors()); // 启用跨域资源共享
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: false })); // 解析URL编码的请求体

// 配置静态文件服务 - 从项目根目录提供静态文件
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

// 连接到MongoDB数据库
let dbConnection = null;

// 确保数据库连接的异步函数
const ensureDbConnection = async () => {
  try {
    dbConnection = await connectDB();
    console.log('数据库连接初始化完成');
  } catch (error) {
    console.error('数据库连接初始化失败:', error.message);
  }
};

// 初始化数据库连接
ensureDbConnection();

// 定期检查并重新连接数据库
setInterval(async () => {
  if (!dbConnection || mongoose.connection.readyState !== 1) {
    console.log('检测到数据库连接断开，尝试重新连接...');
    dbConnection = await connectDB();
  }
}, 30000); // 每30秒检查一次

// 配置路由
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// 定义基本的健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: '服务器运行正常',
    database: dbConnection ? '已连接' : '未连接'
  });
});

// 定义用户管理的基本路由
app.get('/api/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('-password'); // 不返回密码
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 404处理中间件
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: '路由不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.message);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 获取端口号
// 优先使用环境变量中的PORT（云平台自动分配），如果没有则使用默认端口3004
const PORT = process.env.PORT || 3004;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查地址: http://localhost:${PORT}/health`);
  console.log(`用户列表地址: http://localhost:${PORT}/api/users`);
  console.log(`数据库连接状态: ${dbConnection ? '已连接' : '未连接'}`);
});