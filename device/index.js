const WebSocket = require('ws');
const { createDevice } = require('./core/DeviceFactory');


// 加载设备定义
const fs = require('fs');
const path = require('path');

const devicesPath = path.join(__dirname, 'devices');

fs.readdirSync(devicesPath).forEach(file => {
    require(path.join(devicesPath, file));
});


// 连接服务器
const ws = new WebSocket('ws://localhost:3000');

// 所有设备
const devices = new Map();

// =======================
// 连接成功
// =======================
ws.on('open', () => {

    console.log("设备管理器已连接服务器");

    // 创建多个设备
    registerDevice("fan1", "fan");
    registerDevice("fan2", "fan");
    registerDevice("sensor1", "sensor");

});

// =======================
// 注册设备
// =======================
function registerDevice(deviceId, type) {

    // 1告诉服务器：我上线了
    ws.send(JSON.stringify({
        type: "device",
        deviceId: deviceId,
        deviceType: type
    }));

    // 2️本地创建设备实例
    const device = createDevice(type, deviceId, ws);

    devices.set(deviceId, device);

    console.log("设备注册:", deviceId);
}

// =======================
// 接收控制命令
// =======================
ws.on('message', (message) => {

    const data = JSON.parse(message);

    console.log("收到:", data);

    if (data.type === "control") {

        const device = devices.get(data.deviceId);

        if (device) {
            device.handleCommand(data.command);
        }
    }

});

// =======================
// 驱动所有设备运行
// =======================
setInterval(() => {

    // 所有设备更新
    devices.forEach(device => {
        device.update();
    });

    // 自动控制逻辑
    const sensor = devices.get("sensor1");
    const fan = devices.get("fan1");

    if (sensor && fan) {

        // 只有自动模式才执行
        if (fan.mode === "auto") {

            // 简单的自动控制：温度超过30度就开风扇，否则关风扇
            if (sensor.temperature > 30) {
                fan.start();
            } else {
                fan.stop();
            }

        }
    }

}, 1000);

// =======================
// 退出处理
// =======================
process.on('SIGINT', () => {
    console.log("设备管理器关闭...");
    ws.close();
    process.exit();
});