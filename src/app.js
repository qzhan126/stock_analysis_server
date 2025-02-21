require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // 添加 http 模块
const index = require('./routes/index');
const mlModelRoutes = require('./routes/mlModelRoutes');
const errorMiddleware = require('./middlewares/error');
const logger = require('./utils/logger');
const sequelize = require('./config/database');
const socketManager = require('./services/SocketManager'); // 导入 socketManager

const app = express();
const server = http.createServer(app); // 创建 HTTP server

// 初始化 Socket.IO
socketManager.initialize(server);

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// 注入 socketManager 到请求对象
app.use((req, res, next) => {
    req.socketManager = socketManager;
    next();
});

// API 路由
app.use('/api', index);
app.use('/api/ml', mlModelRoutes);  

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API not found'
    });
});

// 错误处理
app.use(errorMiddleware);

// 数据库连接和服务器启动
const startServer = async () => {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');
        
        // 同步数据库模型
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logger.info('Database models synchronized (development mode).');
        } else {
            await sequelize.sync();
            logger.info('Database models synchronized.');
        }

        // 启动服务器（使用 server 而不是 app）
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
            logger.info('Socket.IO is ready for connections');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// 启动服务器
startServer();

// 导出 app 和 server
module.exports = { app, server };