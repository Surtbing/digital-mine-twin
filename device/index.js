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

    // 创建多个设备（延迟发送设备）
    setTimeout(() => {

        registerDevice("fan1", "fan", -10, 0);
        registerDevice("fan2", "fan", 10, 0);
        registerDevice("sensor1", "sensor", 0, 0);
        registerDevice("duct1", "duct", -50, 0);


    }, 300);

});

// 注册设备函数
function registerDevice(deviceId, type, x = 0, z = 0) {

    // 1 告诉服务器：我上线了
    ws.send(JSON.stringify({
        type: "device",
        deviceId: deviceId,
        deviceType: type,
        x: x,
        z: z
    }));

    // 2 本地创建设备实例
    const device = createDevice(type, deviceId, ws);

    // 3 设置位置（核心新增）
    device.x = x;
    device.z = z;

    devices.set(deviceId, device);

    console.log("设备注册:", deviceId);
    console.log(`设备上线: ${deviceId} 位置: ${x.toFixed(1)} ${z.toFixed(1)}`);
}

// 接收服务器控制命令
ws.on('message', (message) => {

    const data = JSON.parse(message);

    console.log("收到:", data);

    // 1 新增设备（来自网页）
    if (data.type === "add_device") {

        const id = data.deviceType + "_" + Date.now();

        console.log("新增设备:", id);

        // 随机位置（核心新增）
        const x = Math.floor(Math.random() * 40 - 20);
        const z = 0;

        registerDevice(id, data.deviceType, x, z);
    }

    // 2 控制命令（来自网页）
    if (data.type === "control") {

        const device = devices.get(data.deviceId);

        if (device) {
            device.handleCommand(data.command);
        }
    }


    // 3 更新设备位置（来自网页）
    if (data.type === "update_position") {

        const device = devices.get(data.deviceId);

        if (device) {
            device.x = data.x;
            device.z = data.z;

            console.log("设备位置已更新:", data.deviceId, data.x, data.z);
        }
    }


    // 4 删除设备（来自网页）
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