const WebSocket = require('ws');

// 连接服务器
const ws = new WebSocket('ws://localhost:3000');

// 设备ID
const deviceId = "fan1";

// 设备状态
let rpm = 0;
let targetRpm = 0;
let temperature = 25;

// =======================
// 连接成功
// =======================
ws.on('open', () => {

    console.log("风机设备已连接服务器");

    // 注册设备
    ws.send(JSON.stringify({
        type: "device",
        deviceId: deviceId
    }));

});

// =======================
// 接收控制命令
// =======================
ws.on('message', (message) => {

    const data = JSON.parse(message);

    console.log("收到控制:", data);

    if (data.type === "control") {

        if (data.command === "start") {
            targetRpm = 1200;  // 启动目标转速
        }

        if (data.command === "stop") {
            targetRpm = 0;     // 停机
        }

    }

});

// =======================
// 模拟设备运行
// =======================
setInterval(() => {

    // 让转速逐渐接近目标转速
    if (rpm < targetRpm) {
        rpm += 20;
    } else if (rpm > targetRpm) {
        rpm -= 20;
    }

    // 环境温度
    const ambientTemp = 25;

    // 发热（转速越高，发热越大）
    let heat = rpm * 0.002;

    // 散热（温差越大，降温越快）
    let cooling = (temperature - ambientTemp) * 0.05;

    // 温度变化
    temperature += heat - cooling;

    // 限制温度范围
    temperature = Math.max(20, Math.min(90, temperature));

    // 发送状态给服务器
    ws.send(JSON.stringify({
        type: "status",
        deviceId: deviceId,
        timestamp: Date.now(),
        data: {
            rpm: Math.round(rpm),
            temperature: Math.round(temperature)
        }
    }));

}, 1000);

// =======================
// 处理程序退出
// =======================
process.on('SIGINT', () => {
    console.log("设备关闭中...");
    ws.close();   // 主动断开 WebSocket
    process.exit();
});