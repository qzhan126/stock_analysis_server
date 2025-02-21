const { Sequelize } = require('sequelize');  
const path = require('path');  
const logger = require('../utils/logger');  

const sequelize = new Sequelize({  
    dialect: 'sqlite',  
    storage: path.join(__dirname, '../../data/analysis.db'),  
    logging: msg => logger.debug(msg),  
    define: {  
        // 默认添加 createdAt 和 updatedAt  
        timestamps: true,  
        // 使用下划线命名  
        underscored: true  
    }  
});  

// 测试数据库连接  
const testConnection = async () => {  
    try {  
        await sequelize.authenticate();  
        logger.info('Database connection established successfully');  
    } catch (error) {  
        logger.error('Unable to connect to the database:', error);  
        throw error;  
    }  
};  

testConnection();  

module.exports = sequelize;  