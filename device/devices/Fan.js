const Device = require('../core/Device');
const { registerDevice } = require('../core/DeviceFactory');  // 必须加载DeviceFactory，才能调用registerDevice函数

class Fan extends Device {

    constructor(deviceId, ws) {
        super(deviceId, ws);

        this.rpm = 0;
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
        this.status = "run";
    }

    stop() {
        this.status = "stop";
    }

    update(env) {
        if (this.mode === "auto") {

            // 高于上限才启动
            if (env.gas > 2) {
                this.status = "run";
            }

            // 低于下限才停止
            else if (env.gas < 1) {
                this.status = "stop";
            }

            // 中间区间（1 ~ 2）不做任何操作
        }

        // 状态驱动 RPM（auto / manual 都生效）
        if (this.status === "run") this.rpm += 20;
        if (this.status === "stop") this.rpm -= 30;

        // 限制范围
        this.rpm = Math.max(0, Math.min(1200, this.rpm));

        // 核心：受环境影响
        this.temperature = env.temperature + this.rpm * 0.01;

        // 报警逻辑
        if (this.temperature > 70) {
            this.status = "alarm";
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