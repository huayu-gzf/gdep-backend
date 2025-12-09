// 1. 引入依赖（需和你的项目环境一致）
const mongoose = require('mongoose'); // 如果你用 MongoDB
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 2. 连接数据库（替换为你的数据库地址）
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('数据库连接成功'))
.catch(err => console.log('数据库连接失败：', err));

// 学生模型（基于你的User模型结构）
const Student = require('./models/User'); // 你的学生模型路径

// 3. 查询所有学生（包含账号密码）
async function queryAllStudents() {
  try {
    // 查询所有学生用户（role为student的）
    const students = await Student.find({ role: 'student' }).select('username name major password createdAt updatedAt').lean();
    
    // 打印结果（格式化输出）
    console.log('\n========== 学生账号密码列表 ==========\n');
    console.log(`共找到 ${students.length} 个学生用户:\n`);
    
    students.forEach((student, index) => {
      console.log(`【学生 ${index + 1}】`);
      console.log(`学号：${student.username}`);
      console.log(`姓名：${student.name}`);
      console.log(`专业：${student.major || '未设置'}`);
      console.log(`密码哈希：${student.password}`);
      console.log(`⚠️  注意：这是加密后的密码哈希值，无法逆向获取明文密码`);
      console.log(`创建时间：${new Date(student.createdAt).toLocaleString('zh-CN')}`);
      console.log(`更新时间：${new Date(student.updatedAt).toLocaleString('zh-CN')}`);
      console.log('\n' + '-'.repeat(50) + '\n');
    });
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  } catch (err) {
    console.log('查询失败：', err.message);
    await mongoose.disconnect();
  }
}

// 执行查询
queryAllStudents();