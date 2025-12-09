const express = require('express');
const router = express.Router();
const { 
  batchCreateStudents, 
  getStudents, 
  getStudentById, 
  updateStudent, 
  deleteStudent,
  batchDeleteStudents,
  createStudent,
  uploadExcel
} = require('../controllers/adminController');
const verifyAdmin = require('../middleware/adminMiddleware');

// 批量创建学生接口
// @route   POST /api/admin/batchCreateStudents
// @desc    批量创建学生用户
// @access  仅管理员
router.post('/batchCreateStudents', verifyAdmin, batchCreateStudents);
router.post('/uploadExcel', verifyAdmin, uploadExcel);

// 获取学生列表接口
// @route   GET /api/admin/students
// @desc    获取所有学生用户列表
// @access  仅管理员
router.get('/students', verifyAdmin, getStudents);

// 批量删除学生（必须在 /students/:id 路由之前定义）
// @route   DELETE /api/admin/students/batch
// @desc    批量删除学生用户
// @access  仅管理员
router.delete('/students/batch', verifyAdmin, batchDeleteStudents);

// 获取单个学生详情
// @route   GET /api/admin/students/:id
// @desc    根据ID获取学生详情
// @access  仅管理员
router.get('/students/:id', verifyAdmin, getStudentById);

// 创建单个学生
// @route   POST /api/admin/students
// @desc    创建单个学生用户
// @access  仅管理员
router.post('/students', verifyAdmin, createStudent);

// 更新学生信息
// @route   PUT /api/admin/students/:id
// @desc    更新学生信息
// @access  仅管理员
router.put('/students/:id', verifyAdmin, updateStudent);

// 删除学生
// @route   DELETE /api/admin/students/:id
// @desc    删除学生用户
// @access  仅管理员
router.delete('/students/:id', verifyAdmin, deleteStudent);

module.exports = router;