const WebSocket = require('ws');
const { createDevice } = require('../device/core/DeviceFactory');

// 创建服务器
const wss = new WebSocket.Server({ port: 3000 });

console.log("WebSocket server started: ws://localhost:3000");

// 维护一个 Map 来存储设备连接和状态
let devices = new Map();
// 维护一个 Set 来存储所有网页客户端连接
let webClients = new Set();
// 设备管理器实例
let manager = null;

wss.on('connection', function (ws) {

    console.log("有新客户端连接");

    ws.on('message', function (message) {

        console.log("RAW MESSAGE:", message.toString());

        const data = JSON.parse(message);

        console.log("Receive:", data);

        // 设备管理器连接
        if (data.type === "manager") {
            manager = ws;
            console.log("设备管理器已连接");
            return;
        }

        // 1 设备连接
        if (data.type === "device") {

            console.log("存入位置:", data.deviceId, data.x, data.z);

            devices.set(data.deviceId, {
                ws: ws,
                deviceType: data.deviceType || "unknown",

                x: data.x || 0,
                z: data.z || 0,

                instance: null
            });

            console.log("设备上线:", data.deviceId, "位置:", data.x, data.z);

            broadcastDeviceList(); // 广播设备列表更新
            return;
        }

        // 2 网页连接
        if (data.type === "web") {
            webClients.add(ws); // 将网页连接加入 Set

            console.log("网页连接");

            // 发送设备列表
            ws.send(JSON.stringify({
                type: "init",
                devices: Array.from(devices.entries()).map(([id, d]) => ({
                    deviceId: id,
                    type: d.deviceType,
                    x: d.x,
                    z: d.z
                }))
            }));

            return;
        }

        // 3 设备状态 → 发给浏览器（设备更新）
        if (data.type === "status") {

            const device = devices.get(data.deviceId);

            if (!device) return;

            console.log("广播数据:", data.deviceId, device.x, device.z);


            // 更新 UI 数据（来自 Fan）
            broadcast({
                type: "device_update",
                deviceId: data.deviceId,

                x: device.x,
                z: device.z,

                data: {
                    rpm: data.data.rpm,
                    temperature: data.data.temperature,
                    status: data.data.status,
                    mode: data.data.mode
                }
            });

        }

        // 4 网页控制 → 发给设备（网页控制命令）
        if (data.type === "control") {

            const device = devices.get(data.deviceId);

            if (!device) {
                console.log("设备不存在:", data.deviceId);
                return;
            }

            console.log("控制设备:", data.deviceId, data.command);

            // 转发给设备（index.js）
            if (device.ws) {
                device.ws.send(JSON.stringify({
                    type: "control",
                    deviceId: data.deviceId,
                    command: data.command
                }));
            } else {
                console.log("该设备没有 WebSocket 连接:", data.deviceId);
            }
        }

        // 5 位置更新 → 发给浏览器（位置更新）
        if (data.type === "update_position") {

            const device = devices.get(data.deviceId);

            if (!device) return;

            // 1 更新服务器记录
            device.x = data.x;
            device.z = data.z;

            console.log("位置更新:", data.deviceId, data.x, data.z);

            // 2 转发给设备管理器
            if (manager) {
                manager.send(JSON.stringify({
                    type: "update_position",
                    deviceId: data.deviceId,
                    x: data.x,
                    z: data.z
                }));
            }

            // 3 广播给所有网页客户端
            broadcast({
                type: "device_update",
                deviceId: data.deviceId,
                x: data.x,
                z: data.z,
                data: {} // 不改状态
            });

            return;
        }

        // 6 新增设备
        if (data.type === "add_device") {

            console.log("转发新增设备请求:", data.deviceType);

            // 只转发给设备管理器
            if (manager) {
                manager.send(JSON.stringify({
                    type: "add_device",
                    deviceType: data.deviceType
                }));
            } else {
                console.log("没有设备管理器");
            }


            return;
        }

        // 7 删除设备
        if (data.type === "remove_device") {

            console.log("转发删除设备请求:", data.deviceId);

            if (manager) {
                manager.send(JSON.stringify({
                    type: "remove_device",
                    deviceId: data.deviceId
                }));
            } else {
                console.log("没有设备管理器");
            }

            return;

        }

        // 8 设备真正删除（manager → server → 所有前端）
        if (data.type === "device_removed") {

            console.log("设备真正删除:", data.deviceId);

            // 只删 Map（不动 ws）
            devices.delete(data.deviceId);

            // 通知所有前端删除模型
            broadcast({
                type: "remove_device",
                deviceId: data.deviceId
            });

            // 更新设备列表
            broadcastDeviceList();

            return;
        }

        // 9 清空设备
        if (data.type === "clear_devices") {
            devices.clear();
            console.log("清空所有设备");
            broadcastDeviceList();
        }


    });

    // 连接关闭
    ws.on('close', function () {

        console.log("连接关闭");

        // 如果是设备管理器断开
        if (ws === manager) {

            console.log("设备管理器断开，清空所有设备");

            devices.clear();

            broadcastDeviceList();

            return;
        }

        // 如果是网页断开
        webClients.delete(ws);

    });

});

// 广播消息给所有网页客户端
function broadcast(msg) {
    webClients.forEach(client => {
        client.send(JSON.stringify(msg));
    });
}

// 广播设备列表更新
function broadcastDeviceList() {

    broadcast({
        type: "device_list_update",
        devices: Array.from(devices.entries()).map(([id, d]) => ({
            deviceId: id,
            type: d.deviceType,
            x: d.x,
            z: d.z
        }))
    });

}