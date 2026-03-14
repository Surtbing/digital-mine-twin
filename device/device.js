const WebSocket = require('ws');

// 连接服务器
const socket = new WebSocket("ws://localhost:3000");

let rpm = 1000;

// 连接成功
socket.on('open', function(){

    console.log("设备已连接服务器");

    // 注册设备
    socket.send(JSON.stringify({
        type:"device"
    }));

    // 每秒发送一次设备状态
    setInterval(()=>{

        socket.send(JSON.stringify({
            type:"status",
            rpm:rpm
        }));

        console.log("发送状态 rpm:", rpm);

    },1000);

});

// 接收服务器消息
socket.on('message',function(message){

    const data = JSON.parse(message);

    console.log("收到控制命令:", data);

    if(data.command === "start"){
        rpm = 1000;
    }

    if(data.command === "stop"){
        rpm = 0;
    }

});