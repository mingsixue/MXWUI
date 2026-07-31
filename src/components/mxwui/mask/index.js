import {lockPageScroll, unlockPageScroll} from '../utils/page-scroll-lock';

Component({
    properties: {
        // 是否显示蒙层
        visible: {
            type: Boolean,
            value: false,
            observer(newVal, oldVal) {
                if (newVal) {
                    this.onMaskOpen();
                    this.lockScroll();
                } else if (oldVal) {
                    this.unlockScroll();
                }
            },
        },
        // 蒙层透明度
        opacity: {
            type: Number,
            value: 0.6,
        },
        // 层级
        zIndex: {
            type: Number,
            value: 520,
        },
        // 是否锁定页面滚动（防穿透）
        lockScroll: {
            type: Boolean,
            value: true,
        },
    },
    lifetimes: {
        created() {
            this._animation = wx.createAnimation({
                duration: 200,
                timingFunction: "ease",
                delay: 0,
            });
            this._scrollLocked = false;
        },
        attached() {
            if (this.data.visible) {
                this.lockScroll();
            }
        },
        detached() {
            this.unlockScroll();
        },
    },
    methods: {
        // 拦截 touchmove，防止蒙层区域带动页面滚动
        preventTouchMove() {},

        // 蒙层点击
        handleTapMask(e) {
            this.triggerEvent("mask_tap", e);
        },

        lockScroll() {
            if (!this.data.lockScroll || this._scrollLocked) {
                return;
            }
            lockPageScroll();
            this._scrollLocked = true;
        },

        unlockScroll() {
            if (!this._scrollLocked) {
                return;
            }
            unlockPageScroll();
            this._scrollLocked = false;
        },

        onMaskOpen() {
            if (!this._animation) {
                this._animation = wx.createAnimation({
                    duration: 200,
                    timingFunction: "ease",
                    delay: 0,
                });
            }
            const opacity = this.data.opacity;
            this._animation.opacity(opacity).step();
            this.setData({
                animationData: this._animation.export(),
            });
        },
    },
});
