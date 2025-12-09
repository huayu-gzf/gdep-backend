const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const connectDB = async () => {
  try {
    // ⬇️⬇️⬇️ 重点在这里：直接写死云端地址，不读取环境变量 ⬇️⬇️⬇️
    // 我已经帮你填好了账号 2324090116 和密码 20050301
    const mongoUri = 'mongodb+srv://2324090116:20050301@cluster0.7onkt8a.mongodb.net/?appName=Cluster0';
    
    console.log('正在连接云端数据库 Cluster0...');
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ 云端 MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 导入用户数据
const importUsers = async () => {
  try {
    const jsonPath = path.join(__dirname, '../users.json');
    const usersData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`准备向云端导入 ${usersData.length} 个用户...`);
    
    // 清空云端旧数据
    const deleteResult = await User.deleteMany({});
    console.log(`已清空云端旧数据，删除了 ${deleteResult.deletedCount} 条记录`);
    
    // 创建新用户
    for (const userData of usersData) {
      await User.create({
        username: userData.username,
        password: userData.password,
        name: userData.name,
        role: userData.role || 'student'
      });
      console.log(`用户创建成功: ${userData.username}`);
    }
    
    console.log(`\n🎉 全部导入成功！现在去 Netlify 登录试试吧！`);
    
  } catch (error) {
    console.error('导入失败:', error.message);
  }
};

// 主函数
const initDatabase = async () => {
  await connectDB();
  await importUsers();
  mongoose.connection.close();
  console.log('数据库连接已关闭');
};

initDatabase();