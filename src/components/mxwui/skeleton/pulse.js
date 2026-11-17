/**
 * 骨架屏呼吸动画（wx.createAnimation）
 * CSS @keyframes 在部分环境下不生效，统一用原生 animation 属性。
 */
export function createPulseController(component) {
    return {
        start() {
            if (component._pulseTimer) return;

            let dim = true;
            const tick = () => {
                const animation = wx.createAnimation({
                    duration: 600,
                    timingFunction: 'ease-in-out'
                });
                animation.opacity(dim ? 0.4 : 1).step();
                dim = !dim;
                component.setData({pulseAni: animation.export()});
            };

            tick();
            component._pulseTimer = setInterval(tick, 600);
        },

        stop() {
            if (component._pulseTimer) {
                clearInterval(component._pulseTimer);
                component._pulseTimer = null;
            }
            const animation = wx.createAnimation({duration: 0});
            animation.opacity(1).step();
            component.setData({pulseAni: animation.export()});
        },

        sync(animate, show) {
            if (show && animate) {
                this.start();
            } else {
                this.stop();
            }
        }
    };
}
