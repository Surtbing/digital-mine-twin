const Device = require('../core/Device');
const { registerDevice } = require('../core/DeviceFactory');  // 必须加载DeviceFactory，才能调用registerDevice函数

class Fan extends Device {

    constructor(deviceId, ws) {
        super(deviceId, ws);

        this.rpm = 0;
        this.targetRpm = 0;
        this.temperature = 25;

        this.status = "stop";
        this.mode = "manual"; // "manual" 或 "auto"
    }

    handleCommand(command) {

        if (command === "start") {
            this.mode = "manual";
            this.start();
        }

        else if (command === "stop") {
            this.mode = "manual";
            this.stop();
        }

        else if (command === "auto") {
            this.mode = "auto";
            console.log(this.deviceId, "→ 自动模式");
        }

        else if (command === "manual") {
            this.mode = "manual";
            console.log(this.deviceId, "→ 手动模式");
        }
    }

    start() {
        this.targetRpm = 1200;
    }

    stop() {
        this.targetRpm = 0;
    }

    update() {

        // 转速渐变
        if (this.rpm < this.targetRpm) this.rpm += 20;
        if (this.rpm > this.targetRpm) this.rpm -= 20;

        // 温度模型
        const ambient = 25;
        let heat = this.rpm * 0.002;
        let cooling = (this.temperature - ambient) * 0.05;

        this.temperature += heat - cooling;

        this.temperature = Math.max(20, Math.min(90, this.temperature));

        // 状态判断
        if (this.temperature > 70) {
            // 温度过高，进入报警状态
            this.status = "alarm";
        } else if (this.rpm > 0) {
            this.status = "run";
        } else {
            this.status = "stop";
        }

        // 上报
        this.sendStatus({
            rpm: Math.round(this.rpm),
            temperature: Math.round(this.temperature),
            status: this.status,
            mode: this.mode   
        });
    }

}

// 自注册
registerDevice("fan", Fan);

module.exports = Fan;