const User = require('../models/User');
const logger = require('../utils/logger');

class AuthController {
    // 用户注册
    static async register(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            const user = await User.createUser(username, password);
            
            res.status(201).json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    token: user.token
                }
            });
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // 用户登录
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            const user = await User.login(username, password);

            res.json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    token: user.token
                }
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // 获取用户信息
    static async getUserInfo(req, res) {
        try {
            const { user } = req;
            res.json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username
                }
            });
        } catch (error) {
            logger.error('Get user info error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = AuthController;