class Device {

    // 设备ID
    constructor(deviceId, ws) {
        this.deviceId = deviceId;   // 设备唯一标识
        this.ws = ws; // WebSocket连接，与服务器通信
    }

    // 处理控制命令
    handleCommand(command) {
        if (command === "start") this.start();
        if (command === "stop") this.stop();
    }

    // 由子类实现具体的设备逻辑
    start() { }
    stop() { }
    update() { }

    // 上报数据，发送设备状态到服务器
    sendStatus(data) {
        this.ws.send(JSON.stringify({
            type: "status",
            deviceId: this.deviceId,
            timestamp: Date.now(),
            data: data
        }));
    }
}

// 导出Device类，供其他设备类型继承
module.exports = Device;