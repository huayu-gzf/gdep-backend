const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

// 加载环境变量
dotenv.config();
console.log('环境变量加载完成');
console.log('数据库连接URI:', process.env.MONGODB_URI || '未设置');

// 数据库连接配置
const connectDB = async () => {
  try {
    // ❌ 删除原来的硬编码和本地默认值
    // const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_welcome_system';
    
    // ✅ 现在的安全写法：只从环境变量读取
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
        throw new Error("未设置 MONGODB_URI 环境变量");
    }
    
    console.log('正在连接云端数据库...');
    console.log('数据库连接URI前20位:', mongoUri.substring(0, 20) + '...'); // 只显示前20位，保护隐私
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    console.log(`数据库名称: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 导入用户数据
const importUsers = async () => {
  try {
    // 读取users.json文件
    const jsonPath = path.join(__dirname, '../users.json');
    console.log('读取用户数据文件:', jsonPath);
    const usersData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`准备导入 ${usersData.length} 个用户...`);
    console.log('用户数据样例:', JSON.stringify(usersData[0], null, 2));
    
    // 先清空现有用户数据
    console.log('开始清空现有用户数据...');
    const deleteResult = await User.deleteMany({});
    console.log(`已清空现有用户数据，删除了 ${deleteResult.deletedCount} 条记录`);
    
    // 验证连接的集合
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('数据库中的集合:', collections.map(c => c.name));
    
    // 逐个创建用户（更可靠）
    const createdUsers = [];
    for (const userData of usersData) {
      console.log(`创建用户: ${userData.username}`);
      // 使用User.create()确保触发pre-save中间件进行密码加密
      const savedUser = await User.create({
        username: userData.username,
        password: userData.password,
        name: userData.name,
        role: userData.role || 'student'
      });
      createdUsers.push(savedUser);
      console.log(`用户创建成功: ${savedUser.username}`);
    }
    
    console.log(`\n成功导入 ${createdUsers.length} 个用户！`);
    
    // 显示导入的用户信息（不包含密码）
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.username}) - 角色: ${user.role}`);
    });
    
    // 验证导入结果
    const count = await User.countDocuments();
    console.log(`\n验证：数据库中当前共有 ${count} 个用户`);
    
    return createdUsers;
  } catch (error) {
    console.error('导入用户失败:', error.message);
    console.error('错误详情:', error);
    throw error;
  }
};

// 主函数
const initDatabase = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 导入用户
    await importUsers();
    
    console.log('\n数据库初始化完成！');
  } catch (error) {
    console.error('初始化失败:', error.message);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
};

// 执行初始化
initDatabase();