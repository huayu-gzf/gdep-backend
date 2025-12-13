const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 1. 定义数据库地址
// ❌ 以前的写法（绝对不要用了）：
// const dbUrl = process.env.MONGO_URI || 'mongodb+srv://账号:密码@...';

// ✅ 现在的安全写法：只从环境变量读取
const dbUrl = process.env.MONGODB_URI || process.env.MONGO_URI;

// 增加一个安全检查，如果没配变量，直接报错提醒，防止空连
if (!dbUrl) {
    console.error("❌ 严重错误：未检测到 MONGODB_URI 环境变量！");
    console.error("请在本地新建 .env 文件，或在部署平台设置 Environment Variables。");
}

// 数据库连接函数
const connectDB = async () => {
  try {
    // 从环境变量中获取数据库连接URI
    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB 数据库连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    console.error(`连接字符串: ${process.env.MONGODB_URI ? '已配置但连接失败' : '未配置'}`);
    console.log('数据库连接失败，但应用将继续运行以提供错误信息');
    // 不抛出错误，允许应用继续运行
    return null;
  }
};

// 导出连接函数
module.exports = connectDB;