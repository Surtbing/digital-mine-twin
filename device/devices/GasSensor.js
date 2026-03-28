const Device = require('../core/Device');
const { registerDevice } = require('../core/DeviceFactory');

class GasSensor extends Device {

    constructor(deviceId, ws) {
        super(deviceId, ws);

        this.gas = 1; // 初始浓度
    }

    update(env) {

        // 从环境获取瓦斯浓度
        this.gas = env.gas;
        // 上报
        this.sendStatus({
            gas: Number(this.gas.toFixed(2))
        });
    }
}

// 注册
registerDevice("gas", GasSensor);

module.exports = GasSensor;