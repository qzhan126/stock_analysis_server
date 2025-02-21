const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class StockAnalysis extends Model {
    // 静态方法：保存或更新分析结果
    static async saveAnalysis(stockCode, analysisResult, lastDataDate) {
        return await this.upsert({
            stockCode,
            analysisResult: JSON.stringify(analysisResult),
            lastDataDate
        });
    }

    // 静态方法：检查是否需要更新
    static async needsUpdate(stockCode, lastDataDate) {
        const analysis = await this.findOne({
            where: {
                stock_code: stockCode,
                last_data_date: {
                    [sequelize.Op.lt]: new Date(lastDataDate)
                }
            }
        });
        return !analysis;
    }

    // 静态方法：获取分析结果
    static async getAnalysis(stockCode) {
        const analysis = await this.findOne({
            where: { stock_code: stockCode }
        });

        if (!analysis) return null;
        return {
            ...analysis.toJSON(),
            analysisResult: JSON.parse(analysis.analysisResult)
        };
    }
}

StockAnalysis.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    stockCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'stock_code',
        unique: true
    },
    analysisResult: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'analysis_result'
    },
    lastDataDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'last_data_date'
    }
}, {
    sequelize,
    modelName: 'StockAnalysis',
    tableName: 'stock_analysis',
    timestamps: true,
    underscored: true
});

module.exports = StockAnalysis;