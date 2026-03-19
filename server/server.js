const WebSocket = require('ws');

// 创建服务器
const wss = new WebSocket.Server({ port: 3000 });

console.log("WebSocket server started: ws://localhost:3000");

let devices = new Map();    // 设备列表
let webClients = new Set();

wss.on('connection', function (ws) {

    console.log("有新客户端连接");

    ws.on('message', function (message) {

        const data = JSON.parse(message);

        console.log("Receive:", data);

        // 设备连接
        if (data.type === "device") {
            devices.set(data.deviceId, ws);
            console.log("设备上线:", data.deviceId);
            return;
        }
        // 网页连接
        if (data.type === "web") {
            webClients.add(ws);
            console.log("网页连接");
            return;
        }

        // 设备状态 → 发给浏览器
        if (data.type === "status") {

            webClients.forEach(client => {
                client.send(JSON.stringify(data));
            });

        }

        // 网页控制 → 发给设备
        if (data.type === "control") {

            const target = devices.get(data.deviceId);

            if (target) {
                target.send(JSON.stringify(data));
                console.log("控制发送到:", data.deviceId);
            } else {
                console.log("设备不存在:", data.deviceId);
            }

        }

    });

    // 连接关闭
    ws.on('close', function () {

        console.log("连接关闭");

        // 删除设备
        devices.forEach((value, key) => {
            if (value === ws) {
                devices.delete(key);
                console.log("设备下线:", key);
            }
        });

        // 删除网页
        webClients.delete(ws);

    });

});