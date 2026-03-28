class Environment {
    constructor() {
        this.temperature = 25;  // 环境温度
        this.airflow = 0;       // 风量
        this.gas = 1;             // 瓦斯浓度
    }

    update(devices) {

        let totalAirflow = 0;

        devices.forEach(device => {
            if (device.rpm) {
                totalAirflow += device.rpm;
            }
        });

        // 风量对温度的影响（核心改造）
        const airflowEffect = totalAirflow / 1000;

        // 环境升温（模拟地热/设备热）
        const heat = 0.05;
        // 冷却（风机主导）
        const cooling = airflowEffect * 0.2;
        this.temperature += heat - cooling;
        
        // 瓦斯浓度变化（核心改造）
        const gasIncrease = 0.02;           // 地下释放
        const gasDecrease = airflowEffect * 0.05; // 风机排出

        this.gas += gasIncrease - gasDecrease;// 限制范围

        this.temperature = Math.max(15, Math.min(40, this.temperature));
        this.gas = Math.max(0, Math.min(10, this.gas));
    }
}

module.exports = Environment;