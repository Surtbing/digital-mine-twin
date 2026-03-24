const WebSocket = require('ws');
const { createDevice } = require('./core/DeviceFactory');
const Environment = require('./core/Environment');


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
// 环境模型（核心新增）
const env = new Environment();

// 连接成功
ws.on('open', () => {

    console.log("设备管理器已连接服务器");

    // 首先告诉服务器我是设备管理器
    ws.send(JSON.stringify({
        type: "manager"
    }));

    // 创建多个设备
    registerDevice("fan1", "fan");
    registerDevice("fan2", "fan");
    registerDevice("sensor1", "sensor");

});

// 注册设备函数
function registerDevice(deviceId, type) {

    // 1 告诉服务器：我上线了
    ws.send(JSON.stringify({
        type: "device",
        deviceId: deviceId,
        deviceType: type
    }));

    // 2 本地创建设备实例
    const device = createDevice(type, deviceId, ws);

    devices.set(deviceId, device);

    console.log("设备注册:", deviceId);
}

// 接收服务器控制命令
ws.on('message', (message) => {

    const data = JSON.parse(message);

    console.log("收到:", data);

    // 1 新增设备（来自网页）
    if (data.type === "add_device") {

        const id = data.deviceType + "_" + Date.now();

        console.log("新增设备:", id);

        registerDevice(id, data.deviceType);
    }

    // 2 控制命令（来自网页）
    if (data.type === "control") {

        const device = devices.get(data.deviceId);

        if (device) {
            device.handleCommand(data.command);
        }
    }

    // 3 删除设备（来自网页）
    if (data.type === "remove_device") {

        const device = devices.get(data.deviceId);

        if (device) {
            console.log("删除设备:", data.deviceId);

            // 删除本地
            devices.delete(data.deviceId);

            // 告诉 server：删完了
            ws.send(JSON.stringify({
                type: "device_removed",
                deviceId: data.deviceId
            }));
        }
    }
});



// 驱动所有设备运行
// 每秒更新一次设备状态，并执行自动控制逻辑
setInterval(() => {

    // 1 更新环境（核心）
    env.update(devices);

    // 2 更新设备（带环境）
    devices.forEach(device => {
        device.update(env);   // 关键改动
    });

    // 3 自动控制（用环境，不用sensor）
    const fan = devices.get("fan1");

    if (fan && fan.mode === "auto") {

        if (env.temperature > 30) {
            fan.start();
        } else {
            fan.stop();
        }
    }

}, 1000);

// 处理退出信号，关闭连接
process.on('SIGINT', () => {
    console.log("设备管理器关闭...");
    ws.close();
    process.exit();
});