import {COLOR} from '../utils/common';
import {getPopoverStyle} from './utils';

Component({
    options: {
        multipleSlots: true,
    },
    properties: {
        // 气泡内容文案（也可用 content 插槽）
        content: {
            type: String,
            value: '',
        },
        // 气泡位置
        placement: {
            type: String,
            value: 'top',
        },
        // 是否显示（受控）
        visible: {
            type: null,
            value: null,
        },
        // 默认是否显示（非受控）
        defaultVisible: {
            type: Boolean,
            value: false,
        },
        // 是否展示透明蒙层（点击空白关闭）
        showMask: {
            type: Boolean,
            value: true,
        },
        // 气泡背景色
        color: {
            type: String,
            value: '#404040',
        },
        // 气泡文字色
        textColor: {
            type: String,
            value: COLOR.WHITE_COLOR,
        },
        // 被遮挡时是否自动调整位置
        autoAdjustOverflow: {
            type: Boolean,
            value: true,
        },
        // 关闭时是否销毁内容
        destroyOnClose: {
            type: Boolean,
            value: false,
        },
        // 内容自定义样式
        contentStyle: {
            type: String,
            value: '',
        },
        // 层级
        zIndex: {
            type: Number,
            value: 999,
        },
    },
    data: {
        innerVisible: false,
        adjustedPlacement: '',
        popoverContentStyle: '',
        arrowStyle: '',
    },
    observers: {
        visible(val) {
            if (val === null || val === undefined) {
                return;
            }
            this._controlled = true;
            this._applyVisible(!!val, true);
        },
        placement() {
            if (this.data.innerVisible) {
                this.updatePopover();
            }
        },
        autoAdjustOverflow() {
            if (this.data.innerVisible) {
                this.updatePopover();
            }
        },
    },
    lifetimes: {
        attached() {
            const {visible, defaultVisible} = this.properties;
            if (visible !== null && visible !== undefined) {
                this._controlled = true;
                this._applyVisible(!!visible, true);
            } else if (defaultVisible) {
                this._applyVisible(true, true);
            }
        },
    },
    methods: {
        _applyVisible(nextVisible, silent, type) {
            if (nextVisible === this.data.innerVisible) {
                if (nextVisible) {
                    this.updatePopover();
                }
                return;
            }

            if (nextVisible) {
                this.setData({
                    innerVisible: true,
                    adjustedPlacement: '',
                    popoverContentStyle: '',
                    arrowStyle: '',
                }, () => {
                    wx.nextTick(() => {
                        this.updatePopover();
                    });
                });
            } else {
                this.setData({
                    innerVisible: false,
                    adjustedPlacement: '',
                    popoverContentStyle: '',
                    arrowStyle: '',
                });
            }

            if (!silent) {
                this.triggerEvent('popover_visible_change', {
                    visible: nextVisible,
                    type: type || 'trigger',
                });
            }
        },

        updatePopover() {
            if (!this.data.innerVisible) {
                return;
            }

            const query = this.createSelectorQuery();
            query.select('#mx-popover-root').boundingClientRect();
            query.select('#mx-popover-children').boundingClientRect();
            query.select('#mx-popover-content').boundingClientRect();
            query.exec((res) => {
                const containerRect = res && res[0];
                const childrenRect = res && res[1];
                const contentRect = res && res[2];
                if (!containerRect || !childrenRect || !contentRect || !contentRect.width) {
                    // 内容尚未渲染完成时重试一次
                    setTimeout(() => {
                        if (this.data.innerVisible) {
                            this.updatePopover();
                        }
                    }, 30);
                    return;
                }

                const systemInfo = wx.getSystemInfoSync();
                const {placement, autoAdjustOverflow} = this.data;
                const result = getPopoverStyle(placement, autoAdjustOverflow, {
                    containerRect,
                    childrenRect,
                    contentRect,
                    systemInfo,
                });

                this.setData({
                    popoverContentStyle: result.popoverContentStyle,
                    adjustedPlacement: result.adjustedPlacement,
                    arrowStyle: result.arrowStyle || '',
                });
            });
        },

        handleTriggerTap() {
            const nextVisible = !this.data.innerVisible;
            if (this._controlled) {
                this.triggerEvent('popover_visible_change', {
                    visible: nextVisible,
                    type: 'trigger',
                });
                return;
            }
            this._applyVisible(nextVisible);
        },

        handleMaskTap() {
            if (!this.data.innerVisible) {
                return;
            }
            if (this._controlled) {
                this.triggerEvent('popover_visible_change', {
                    visible: false,
                    type: 'mask',
                });
                return;
            }
            this._applyVisible(false, false, 'mask');
        },

        // 阻止冒泡到蒙层
        handleContentTap() {},
    },
});
