const mongoose = require('mongoose');

// 缓存数据库连接，防止 Netlify 函数重复连接导致崩溃
let cachedConn = null;

const connectDB = async () => {
  if (cachedConn) {
    console.log('✅ 使用现有的数据库连接');
    return cachedConn;
  }

  try {
    // 读取环境变量
    const dbUrl = process.env.MONGO_URI;
    
    if (!dbUrl) {
      throw new Error('未找到 MONGO_URI 环境变量');
    }

    console.log('正在建立新的数据库连接...');
    // 连接配置，增加超时设置
    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5秒连不上就报错，别卡死
    });

    cachedConn = conn;
    console.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB 连接失败: ${error.message}`);
    // 这里抛出错误，让后端知道连不上，而不是假装成功
    throw error;
  }
};

module.exports = connectDB;
