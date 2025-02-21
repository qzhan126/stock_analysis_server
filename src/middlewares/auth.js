const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * 认证中间件
 * 验证请求头中的 token 并注入用户信息
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 从请求头获取 token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header'
            });
        }

        // 验证 token 格式
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format'
            });
        }

        const token = parts[1];
        
        // 查找用户
        const user = await User.findByToken(token);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // 将用户信息注入到请求对象
        req.user = user;
        
        // 继续下一个中间件或路由处理
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = authMiddleware;