const express = require('express');
const serverless = require('serverless-http');
const app = require('../server'); // 引入外面的 server.js

// 把 Express 应用转换为 Netlify 能懂的函数
module.exports.handler = serverless(app);