const WebSocket = require('ws');

// 创建服务器
const wss = new WebSocket.Server({ port: 3000 });

console.log("WebSocket server started: ws://localhost:3000");

// 维护一个 Map 来存储设备连接和状态
let devices = new Map();
// 维护一个 Set 来存储所有网页客户端连接
let webClients = new Set();

wss.on('connection', function (ws) {

    console.log("有新客户端连接");

    ws.on('message', function (message) {

        const data = JSON.parse(message);

        console.log("Receive:", data);

        // 设备连接
        if (data.type === "device") {

            devices.set(data.deviceId, {
                ws: ws,
                deviceType: data.deviceType || "unknown",
                lastData: null
            });

            console.log("设备上线:", data.deviceId);

            // 新增：通知所有网页
            webClients.forEach(client => {
                client.send(JSON.stringify({
                    type: "device_list_update",
                    devices: Array.from(devices.entries()).map(([id, d]) => ({
                        deviceId: id,
                        type: d.deviceType
                    }))
                }));
            });
            return;
        }

        // 网页连接
        if (data.type === "web") {
            webClients.add(ws); // 将网页连接加入 Set

            console.log("网页连接");

            // 1️发送设备列表
            ws.send(JSON.stringify({
                type: "init",
                devices: Array.from(devices.entries()).map(([id, d]) => ({
                    deviceId: id,
                    type: d.deviceType
                }))
            }));

            // 2️发送设备当前状态（关键新增）
            ws.send(JSON.stringify({
                type: "init_data",
                devices: Array.from(devices.entries()).map(([id, d]) => ({
                    deviceId: id,
                    data: d.lastData
                }))
            }));

            return;
        }

        // 设备状态 → 发给浏览器
        if (data.type === "status") {

            const device = devices.get(data.deviceId);

            if (device) {
                device.lastData = data.data; // 🔥 保存数据
            }

            // 统一转发格式
            const msg = {
                type: "device_update",
                deviceId: data.deviceId,
                data: data.data
            };

            webClients.forEach(client => {
                client.send(JSON.stringify(msg));
            });

        }

        // 网页控制 → 发给设备
        if (data.type === "control") {

            const target = devices.get(data.deviceId);

            // 发送控制命令给设备
            if (target) {
                target.ws.send(JSON.stringify({
                    type: "control",
                    deviceId: data.deviceId,
                    command: data.command
                }));

                console.log("控制发送到:", data.deviceId);
            }
        }

    });

    // 连接关闭
    ws.on('close', function () {

        console.log("连接关闭");

        let removedDevice = null; // 标记是否有设备下线

        // 删除设备
        devices.forEach((value, key) => {
            if (value.ws === ws) {
                devices.delete(key);
                removedDevice = key; // 记录下线设备
                console.log("设备下线:", key);
            }
        });

        // 删除网页
        webClients.delete(ws);

        // 通知前端更新设备列表
        if (removedDevice) {
            webClients.forEach(client => {
                client.send(JSON.stringify({
                    type: "device_list_update",
                    devices: Array.from(devices.entries()).map(([id, d]) => ({
                        deviceId: id,
                        type: d.deviceType
                    }))
                }));
            });
        }

    });

});