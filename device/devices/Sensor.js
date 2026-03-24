const Device = require('../core/Device');
const { registerDevice } = require('../core/DeviceFactory');

class Sensor extends Device {

    constructor(deviceId, ws) {
        super(deviceId, ws);

        this.temperature = 25; // 初始温度
    }

    start() { }
    stop() { }

    update(env) {

        // 从环境读取温度（核心改造）
        this.temperature = env.temperature;

        this.sendStatus({
            temperature: Math.round(this.temperature)
        });
    }
}

// 自注册
registerDevice("sensor", Sensor);

module.exports = Sensor;