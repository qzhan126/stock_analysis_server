const StockAnalysis = require('../models/Analysis');
const logger = require('../utils/logger');

class AnalysisController {
    // 获取股票分析结果
    static async getAnalysis(req, res) {
        try {
            const { stockCode } = req.params;
            
            // 首先检查数据库中是否有最新分析结果
            const analysis = await StockAnalysis.getAnalysis(stockCode);
            
            if (!analysis) {
                // 如果没有分析结果，请求本地设备进行分析
                try {
                    const deviceAnalysis = await req.socketManager.requestAnalysis(stockCode);
                    logger.info(`Device analysis result: ${JSON.stringify(deviceAnalysis)}`);
                    // 保存分析结果到数据库
                    // await StockAnalysis.saveAnalysis(
                    //     stockCode, 
                    //     deviceAnalysis.result,
                    //     deviceAnalysis.timestamp
                    // );

                    return res.json({
                        success: true,
                        data: deviceAnalysis,
                        source: 'real-time'
                    });
                } catch (deviceError) {
                    logger.error('Device analysis error:', deviceError);
                    return res.status(503).json({
                        success: false,
                        message: 'Analysis device unavailable',
                        error: deviceError.message
                    });
                }
            }

            // 检查分析结果是否需要更新
            const needsUpdate = await StockAnalysis.needsUpdate(stockCode, analysis.lastDataDate);
            
            if (needsUpdate) {
                // 请求实时更新
                try {
                    const updatedAnalysis = await req.socketManager.requestAnalysis(stockCode);
                    
                    // 更新数据库
                    // await StockAnalysis.saveAnalysis(
                    //     stockCode,
                    //     updatedAnalysis.result,
                    //     updatedAnalysis.timestamp
                    // );

                    return res.json({
                        success: true,
                        data: updatedAnalysis.result,
                        source: 'updated'
                    });
                } catch (updateError) {
                    logger.warn('Update failed, returning cached data:', updateError);
                    // 如果更新失败，返回缓存的数据
                    return res.json({
                        success: true,
                        data: analysis,
                        source: 'cached',
                        warning: 'Update failed, showing cached data'
                    });
                }
            }

            // 返回缓存的分析结果
            res.json({
                success: true,
                data: analysis,
                source: 'cached'
            });
        } catch (error) {
            logger.error('Get analysis error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 创建或更新分析结果
    static async saveAnalysis(req, res) {
        try {
            const { stockCode } = req.params;
            const { analysisResult, lastDataDate } = req.body;

            if (!analysisResult || !lastDataDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Analysis result and last data date are required'
                });
            }

            await StockAnalysis.saveAnalysis(stockCode, analysisResult, lastDataDate);

            // 通知订阅者有新的分析结果
            req.socketManager.broadcastAnalysis(stockCode, analysisResult);

            res.status(201).json({
                success: true,
                message: 'Analysis saved successfully'
            });
        } catch (error) {
            logger.error('Save analysis error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 检查是否需要更新
    static async checkUpdate(req, res) {
        try {
            const { stockCode } = req.params;
            const { lastDataDate } = req.query;

            if (!lastDataDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Last data date is required'
                });
            }

            const needsUpdate = await StockAnalysis.needsUpdate(stockCode, lastDataDate);

            res.json({
                success: true,
                data: { 
                    needsUpdate,
                    lastCheckTime: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Check update error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 批量获取分析结果
    static async getBatchAnalysis(req, res) {
        try {
            const { stockCodes } = req.body;

            if (!Array.isArray(stockCodes) || stockCodes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock codes array is required'
                });
            }

            const results = await Promise.all(
                stockCodes.map(async (stockCode) => {
                    try {
                        const analysis = await StockAnalysis.getAnalysis(stockCode);
                        return {
                            stockCode,
                            success: true,
                            data: analysis
                        };
                    } catch (error) {
                        return {
                            stockCode,
                            success: false,
                            error: error.message
                        };
                    }
                })
            );

            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            logger.error('Batch analysis error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 删除分析结果
    static async deleteAnalysis(req, res) {
        try {
            const { stockCode } = req.params;
            
            await StockAnalysis.deleteAnalysis(stockCode);

            res.json({
                success: true,
                message: 'Analysis deleted successfully'
            });
        } catch (error) {
            logger.error('Delete analysis error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // WebSocket 处理方法
    static async handleWebSocketAnalysis(socket, data) {
        try {
            const { stockCode, forceUpdate = false } = data;
            
            // 获取分析结果
            const analysis = await StockAnalysis.getAnalysis(stockCode);
            
            if (!analysis || forceUpdate) {
                // 请求实时分析
                const deviceAnalysis = await socket.request.socketManager.requestAnalysis(stockCode);
                
                // 保存到数据库
                await StockAnalysis.saveAnalysis(
                    stockCode,
                    deviceAnalysis.result,
                    deviceAnalysis.timestamp
                );

                // 发送结果给客户端
                socket.emit('analysis_result', {
                    success: true,
                    data: deviceAnalysis.result,
                    source: 'real-time'
                });
            } else {
                // 发送缓存的结果
                socket.emit('analysis_result', {
                    success: true,
                    data: analysis,
                    source: 'cached'
                });
            }
        } catch (error) {
            logger.error('WebSocket analysis error:', error);
            socket.emit('analysis_error', {
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = AnalysisController;