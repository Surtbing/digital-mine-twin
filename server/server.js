const WebSocket = require('ws');

// 创建服务器
const wss = new WebSocket.Server({ port: 3000 });

console.log("WebSocket server started: ws://localhost:3000");

let deviceSocket = null;

wss.on('connection', function connection(ws) {

    console.log("Client connected");

    ws.on('message', function incoming(message) {

        const data = JSON.parse(message);

        console.log("Receive:", data);

        // 设备注册
        if (data.type === "device") {
            deviceSocket = ws;
            console.log("Device connected");
        }

        // 设备状态
        if (data.type === "status") {

            wss.clients.forEach(client => {
                if (client !== ws) {
                    client.send(JSON.stringify(data));
                }
            });

        }

        // 前端控制
        if (data.type === "control") {

            if (deviceSocket) {
                deviceSocket.send(JSON.stringify(data));
            }

        }

    });

});