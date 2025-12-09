const User = require('../models/User');
const xlsx = require('xlsx');
const multer = require('multer');
const { Readable } = require('stream');

// 配置multer内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  },
  fileFilter: (req, file, cb) => {
    // 验证文件类型
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('仅支持.xlsx和.xls格式的Excel文件'), false);
    }
  }
}).single('excelFile');

/**
 * 解析Excel文件并批量创建学生
 * @route POST /api/admin/uploadExcel
 * @access 仅管理员
 */
const uploadExcel = async (req, res) => {
  // 使用multer处理文件上传
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('文件上传错误:', err.message);
        return res.status(400).json({
          success: false,
          message: err.message || '文件上传失败'
        });
      }

      if (!req.file) {
        console.error('未收到上传的文件');
        return res.status(400).json({
          success: false,
          message: '请选择要上传的Excel文件'
        });
      }

      console.log('==========================================');
      console.log('开始处理Excel文件上传');
      console.log(`文件名: ${req.file.originalname}`);
      console.log(`文件大小: ${Math.round(req.file.size / 1024)}KB`);
      console.log(`MIME类型: ${req.file.mimetype}`);

      // 将缓冲区转换为可读流
      const fileStream = Readable.from(req.file.buffer);
      
      // 解析Excel文件
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 转换为JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      console.log(`解析Excel完成，共获取 ${jsonData.length} 条记录`);
      console.log('原始Excel数据:', JSON.stringify(jsonData, null, 2));

      if (jsonData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel文件中没有数据'
        });
      }

      // 记录第一行数据用于调试
      if (jsonData.length > 0) {
        const firstRow = jsonData[0];
        const keys = Object.keys(firstRow);
        console.log('第一行的键:', keys);
        console.log('第一行数据:', firstRow);
      }

      // 映射Excel数据到学生对象（支持常见的列名变体）
      const students = jsonData.map((row, index) => {
        console.log(`处理第${index + 1}行数据:`, row);
        
        // 支持多种可能的列名（不区分大小写）
        const getField = (possibleNames) => {
          for (const name of possibleNames) {
            const key = Object.keys(row).find(k => 
              k.toLowerCase() === name.toLowerCase()
            );
            if (key) {
              console.log(`找到列名: ${key} -> ${row[key]}`);
              return String(row[key]).trim();
            }
          }
          console.log(`未找到匹配的列名，尝试的列名: ${possibleNames}`);
          return null;
        };

        const result = {
          username: getField(['username', '学号', 'studentid', 'id']),
          name: getField(['name', '姓名', 'studentname']),
          major: getField(['major', '专业', 'department'])
        };
        
        console.log(`映射结果:`, result);
        return result;
      });

      // 验证映射结果
      const validStudents = [];
      const invalidRows = [];
      
      students.forEach((student, index) => {
        if (!student.username || !student.name || !student.major) {
          invalidRows.push({
            row: index + 2, // 表格行号从1开始，数据行从2开始
            reason: '缺少必要字段（学号、姓名、专业）',
            data: student
          });
        } else {
          validStudents.push(student);
        }
      });

      console.log(`有效数据: ${validStudents.length} 条, 无效数据: ${invalidRows.length} 条`);

      if (invalidRows.length > 0) {
        console.warn('无效数据行:', invalidRows);
        // 如果有无效数据，仍然处理有效数据，但返回警告
        res.status(200).json({
          success: true,
          message: `检测到 ${invalidRows.length} 条无效数据，已跳过`,
          invalidRows,
          ...await processStudents(validStudents)
        });
      } else {
        // 所有数据都有效，直接处理
        res.status(200).json({
          success: true,
          message: 'Excel文件解析成功，开始处理学生数据',
          ...await processStudents(validStudents)
        });
      }

    } catch (error) {
      console.error('❌ Excel处理失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误，Excel处理失败',
        error: error.message
      });
    }
  });
};

// 抽取学生处理逻辑，复用批量创建的核心逻辑
const processStudents = async (students) => {
  if (students.length === 0) {
    return {
      successCount: 0,
      failCount: 0,
      duplicateUsernames: [],
      failedStudents: []
    };
  }

  // 统计变量
  let successCount = 0;
  let failCount = 0;
  const duplicateUsernames = [];
  const failedStudents = [];

  // 首先获取所有已存在的用户名，用于检测重复
  const existingUsernames = await User.find(
    { username: { $in: students.map(s => s.username) } },
    'username'
  ).then(users => users.map(user => user.username));

  // 处理每个学生数据
  for (const [index, studentData] of students.entries()) {
    try {
      // 检查是否重复
      if (existingUsernames.includes(studentData.username)) {
        duplicateUsernames.push(studentData.username);
        failCount++;
        continue;
      }

      // 生成初始密码：Student + 学号后6位
      const passwordSuffix = studentData.username.slice(-6);
      const initialPassword = `Student${passwordSuffix}`;

      // 创建学生用户
      await User.create({
        username: studentData.username,
        password: initialPassword,
        name: studentData.name,
        role: 'student',
        major: studentData.major
      });

      successCount++;
    } catch (error) {
      failCount++;
      failedStudents.push({
        index: index + 1,
        username: studentData.username || '未知',
        reason: error.message
      });
      console.error(`❌ 创建学生失败: ${studentData.username}`, error.message);
    }
  }

  return {
    successCount,
    failCount,
    duplicateUsernames,
    failedStudents
  };
};

/**
 * 批量创建学生用户
 * @route POST /api/admin/batchCreateStudents
 * @access 仅管理员
 */
const batchCreateStudents = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('开始批量创建学生用户 - 收到请求');
    console.log(`请求时间: ${new Date().toISOString()}`);
    console.log('接收到的请求体:', req.body);
    
    const { students } = req.body;
    
    // 验证输入
    if (!students || !Array.isArray(students) || students.length === 0) {
      console.error('输入验证失败: 学生数据列表无效');
      return res.status(400).json({
        success: false,
        message: '请提供有效的学生数据列表'
      });
    }
    
    console.log(`开始处理 ${students.length} 个学生数据`);
    
    // 调用共用的处理函数
    const result = await processStudents(students);
    
    console.log('\n==========================================');
    console.log(`✅ 批量创建完成!`);
    console.log(`统计: 总数量=${students.length}, 成功=${result.successCount}, 失败=${result.failCount}`);
    
    res.status(200).json({
      success: true,
      message: '批量创建完成',
      ...result
    });
  } catch (error) {
    console.error('❌ 批量创建学生时发生严重错误:', error);
    console.log('==========================================');
    res.status(500).json({
      success: false,
      message: '服务器错误，批量创建失败',
      error: error.message
    });
  }
};

/**
 * 获取所有学生用户列表
 * @route GET /api/admin/students
 * @access 仅管理员
 */
const getStudents = async (req, res) => {
  try {
    // 获取所有学生，不包含密码字段
    const students = await User.find({ role: 'student' });
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取学生列表失败'
    });
  }
};

/**
 * 获取单个学生详情
 * @route GET /api/admin/students/:id
 * @access 仅管理员
 */
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await User.findOne({ _id: id, role: 'student' }).select('-password');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生未找到'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取学生详情失败'
    });
  }
};

/**
 * 创建单个学生
 * @route POST /api/admin/students
 * @access 仅管理员
 */
const createStudent = async (req, res) => {
  try {
    const { username, name, major, password } = req.body;
    
    console.log('=== 创建学生调试 ===');
    console.log('请求数据:', { username, name, major, password: password ? '***' : '无密码' });
    
    // 验证输入
    if (!username || !name || !major) {
      console.log('验证失败: 缺少必要信息');
      return res.status(400).json({
        success: false,
        message: '请提供学号、姓名和专业信息'
      });
    }
    
    // 检查学号是否已存在
    console.log('检查学号是否已存在:', username);
    const existingStudent = await User.findOne({ username });
    if (existingStudent) {
      console.log('学号已存在，拒绝创建:', username);
      return res.status(400).json({
        success: false,
        message: '学号已存在'
      });
    }
    
    // 如果没有提供密码，生成默认密码
    let finalPassword;
    if (!password || password.trim() === '') {
      const passwordSuffix = username.slice(-6);
      finalPassword = `Student${passwordSuffix}`;
    } else {
      finalPassword = password.trim();
    }
    
    // 创建学生
    const newStudent = await User.create({
      username,
      password: finalPassword,
      name,
      role: 'student',
      major
    });
    
    // 返回创建的学生信息（包含密码）
    res.status(201).json({
      success: true,
      message: '学生创建成功',
      data: newStudent,
      initialPassword: finalPassword
    });
  } catch (error) {
    console.error('创建学生失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建学生失败'
    });
  }
};

/**
 * 更新学生信息
 * @route PUT /api/admin/students/:id
 * @access 仅管理员
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, major, password } = req.body;
    
    console.log('=== 更新学生信息调试 ===');
    console.log('学生ID:', id);
    console.log('请求体:', { name, major, password: password ? '***' : '无密码' });
    
    // 验证输入
    if (!name || !major) {
      console.log('验证失败: 缺少姓名或专业信息');
      return res.status(400).json({
        success: false,
        message: '请提供姓名和专业信息'
      });
    }
    
    // 查找学生
    const student = await User.findOne({ _id: id, role: 'student' });
    
    if (!student) {
      console.log('学生未找到，ID:', id);
      return res.status(404).json({
        success: false,
        message: '学生未找到'
      });
    }
    
    // 更新学生信息
    student.name = name;
    student.major = major;
    
    // 如果提供了密码，更新密码（pre-save中间件会自动加密）
    if (password && password.trim() !== '') {
      student.password = password.trim();
      console.log('包含密码更新，密码:', password.trim());
      // 确保密码字段被标记为已修改，这样pre-save中间件才会触发
      student.markModified('password');
    }
    
    // 保存学生信息（这会触发pre-save中间件）
    await student.save();
    
    // 返回更新后的学生信息（不包含密码）
    const updatedStudent = student.toObject();
    delete updatedStudent.password;
    
    console.log('更新成功，学生信息:', updatedStudent.username, updatedStudent.name);
    
    res.status(200).json({
      success: true,
      message: password && password.trim() !== '' ? '学生信息及密码更新成功' : '学生信息更新成功',
      data: updatedStudent
    });
  } catch (error) {
    console.error('更新学生信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新学生信息失败'
    });
  }
};

/**
 * 删除学生
 * @route DELETE /api/admin/students/:id
 * @access 仅管理员
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedStudent = await User.findOneAndDelete({ _id: id, role: 'student' });
    
    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: '学生未找到'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '学生删除成功',
      data: {
        username: deletedStudent.username,
        name: deletedStudent.name
      }
    });
  } catch (error) {
    console.error('删除学生失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除学生失败'
    });
  }
};

/**
 * 批量删除学生
 * @route DELETE /api/admin/students/batch
 * @access 仅管理员
 */
const batchDeleteStudents = async (req, res) => {
  try {
    const { ids, studentIds } = req.body;
    
    // 兼容前端发送的两种格式：ids 或 studentIds
    const idsToDelete = ids || studentIds;
    
    if (!idsToDelete || !Array.isArray(idsToDelete) || idsToDelete.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的学生ID列表'
      });
    }
    
    console.log(`批量删除学生，ID列表:`, idsToDelete);
    
    // 批量删除学生
    const result = await User.deleteMany({ 
      _id: { $in: idsToDelete }, 
      role: 'student' 
    });
    
    console.log(`批量删除结果:`, result);
    
    res.status(200).json({
      success: true,
      message: `成功删除 ${result.deletedCount} 名学生`,
      data: {
        deletedCount: result.deletedCount,
        totalRequested: idsToDelete.length
      }
    });
  } catch (error) {
    console.error('批量删除学生失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，批量删除学生失败'
    });
  }
};

module.exports = {
  batchCreateStudents,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  batchDeleteStudents,  // 导出批量删除方法
  uploadExcel  // 导出新添加的Excel上传方法
};