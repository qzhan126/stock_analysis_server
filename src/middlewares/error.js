const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
const errorMiddleware = (err, req, res, next) => {
    logger.error('Error:', err);

    // 处理不同类型的错误
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    // 默认错误响应
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

module.exports = errorMiddleware;