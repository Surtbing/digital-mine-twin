const { registerDevice } = require('../core/DeviceFactory');
const Device = require('../core/Device');

class Duct extends Device {

    constructor(deviceId, ws) {
        super(deviceId, ws);

        this.type = "duct";
    }

    update(env) {
        // 风筒是结构设备，暂时不用逻辑
    }
}

// 注册到工厂
registerDevice("duct", Duct);

module.exports = Duct;