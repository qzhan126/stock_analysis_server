const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User extends Model {
    // 实例方法：验证密码
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // 实例方法：生成新token
    async generateToken() {
        this.token = crypto.randomBytes(32).toString('hex');
        await this.save();
        return this.token;
    }

    // 静态方法：创建用户
    static async createUser(username, password) {
        // 使用 bcryptjs 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const token = crypto.randomBytes(32).toString('hex');

        return await this.create({
            username,
            password: hashedPassword,
            token
        });
    }

    // 静态方法：登录
    static async login(username, password) {
        const user = await this.findOne({ where: { username } });
        if (!user) {
            throw new Error('User not found');
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        await user.generateToken();
        return user;
    }

    // 静态方法：根据token查找用户
    static async findByToken(token) {
        return await this.findOne({
            where: { token },
            attributes: { exclude: ['password'] }
        });
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 30]
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [6, 100]
        }
    },
    token: {
        type: DataTypes.STRING,
        unique: true
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['username']
        },
        {
            unique: true,
            fields: ['token']
        }
    ]
});

module.exports = User;