const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 数据库连接函数
const connectDB = async () => {
  try {
    // 1. 定义数据库地址
    // 优先读取环境变量 MONGO_URI 或 MONGODB_URI，如果没有（比如在本地运行），就用云数据库地址
    // ⚠️ 注意：请将 '你的密码' 替换为你设置的真实密码！
    const dbUrl = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://2324090116:20050301@cluster0.7onkt8a.mongodb.net/?appName=Cluster0';
    
    // 2. 连接数据库
    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB 数据库连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    console.log('数据库连接失败，但应用将继续运行以提供错误信息');
    // 不抛出错误，允许应用继续运行
    return null;
  }
};

// 导出连接函数
module.exports = connectDB;