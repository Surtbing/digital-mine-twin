const Device = require('../core/Device');
const { registerDevice } = require('../core/DeviceFactory');

class Sensor extends Device {

    constructor(deviceId, ws) {
        super(deviceId, ws);

        this.temperature = 25; // 初始温度
    }

    start() {}
    stop() {}

    update() {

        // 模拟环境温度波动
        const fluctuation = (Math.random() - 0.5) * 2; // -1 到 +1 之间的随机数
        this.temperature += fluctuation;

        this.temperature = Math.max(15, Math.min(40, this.temperature)); // 温度限制在15-40度之间

        this.sendStatus({
            temperature: Math.round(this.temperature)
        });
    }
}

// 自注册
registerDevice("sensor", Sensor);

module.exports = Sensor;