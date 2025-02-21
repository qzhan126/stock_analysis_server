const { Server } = require('socket.io');
const logger = require('../utils/logger');

class SocketManager {
    constructor() {
        this.io = null;
        this.devices = new Map(); // 存储分析设备
        this.pendingRequests = new Map(); // 存储待处理的请求
        this.clientSubscriptions = new Map(); // 存储客户端订阅
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"]
            }
        });

        this.setupEventHandlers();
        logger.info('Socket.IO initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const isDevice = socket.handshake.auth.deviceId;
            
            if (isDevice) {
                this.handleDeviceConnection(socket);
            } else {
                this.handleClientConnection(socket);
            }

            socket.on('disconnect', () => {
                if (isDevice) {
                    this.handleDeviceDisconnection(socket);
                } else {
                    this.handleClientDisconnection(socket);
                }
            });
        });
    }

    handleDeviceConnection(socket) {
        const deviceId = socket.handshake.auth.deviceId;
        logger.info(`Device connected: ${deviceId}`);

        socket.on('register_device', (data) => {
            logger.info(`register_device: ${data}`);

            this.devices.set(deviceId, {
                socket,
                type: data.type,
                status: 'available'
            });
            logger.info(`Device registered: ${deviceId} (${data.type})`);
        });

        socket.on('analysis_result', (data) => {
            this.handleAnalysisResult(data);
        });
    }

    handleClientConnection(socket) {
        logger.info(`Client connected: ${socket.id}`);

        socket.on('subscribe_stock', (stockCode) => {
            if (!this.clientSubscriptions.has(stockCode)) {
                this.clientSubscriptions.set(stockCode, new Set());
            }
            this.clientSubscriptions.get(stockCode).add(socket.id);
            socket.join(`stock:${stockCode}`);
            logger.info(`Client ${socket.id} subscribed to stock ${stockCode}`);
        });

        socket.on('unsubscribe_stock', (stockCode) => {
            const subscribers = this.clientSubscriptions.get(stockCode);
            if (subscribers) {
                subscribers.delete(socket.id);
                if (subscribers.size === 0) {
                    this.clientSubscriptions.delete(stockCode);
                }
            }
            socket.leave(`stock:${stockCode}`);
        });
    }

    handleDeviceDisconnection(socket) {
        const deviceId = socket.handshake.auth.deviceId;
        this.devices.delete(deviceId);
        logger.info(`Device disconnected: ${deviceId}`);
    }

    handleClientDisconnection(socket) {
        this.clientSubscriptions.forEach((subscribers, stockCode) => {
            if (subscribers.has(socket.id)) {
                subscribers.delete(socket.id);
                if (subscribers.size === 0) {
                    this.clientSubscriptions.delete(stockCode);
                }
            }
        });
        logger.info(`Client disconnected: ${socket.id}`);
    }

    async requestAnalysis(stockCode) {
        // 查找可用的分析设备
        logger.info(`Requesting analysis for stock ${this.devices.values()}`);
        const availableDevice = Array.from(this.devices.values())
            .find(device => device.status === 'available' && device.type === 'analyzer');

        if (!availableDevice) {
            throw new Error('No available analysis device');
        }

        const requestId = `${stockCode}-${Date.now()}`;
        
        // 创建Promise以等待结果
        const resultPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Analysis request timeout'));
            }, 30000000); // 60秒超时

            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout
            });
        });

        // 发送请求到设备
        availableDevice.socket.emit('analysis_request', {
            requestId,
            stockCode
        });

        return resultPromise;
    }

    handleAnalysisResult(data,socket) {
        
        const { requestId, status, result, error } = data;  
        const request = this.pendingRequests.get(requestId);  
        
        if (request) {  
            clearTimeout(request.timeout);  
            this.pendingRequests.delete(requestId);  
    
            // 修正：通过遍历devices找到对应的设备  
            // for (const [deviceId, device] of this.devices.entries()) {  
            //     if (device.socket.id === socket.id) {  
            //         device.status = 'available';  
            //         break;  
            //     }  
            // }  
    
            if (status === 'success') {  
                request.resolve(result);  
                // 广播结果给订阅的客户端  
                this.broadcastAnalysis(data.stockCode, result);  
            } else {  
                request.reject(new Error(error));  
            }  
        }  
    }  

    
    broadcastAnalysis(stockCode, analysis) {
        this.io.to(`stock:${stockCode}`).emit('stock_analysis', {
            stockCode,
            analysis,
            timestamp: new Date().toISOString()
        });
    }
}

const socketManager = new SocketManager();
module.exports = socketManager;