// device/core/DeviceFactory.js

const registry = {};

function registerDevice(type, clazz) {
    registry[type] = clazz;
}

function createDevice(type, deviceId, ws) {
    const DeviceClass = registry[type];

    if (!DeviceClass) {
        throw new Error("未知设备类型: " + type);
    }

    return new DeviceClass(deviceId, ws);
}

module.exports = {
    createDevice,
    registerDevice
};