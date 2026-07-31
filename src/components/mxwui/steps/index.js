import {COLOR} from '../utils/common';

Component({
    properties: {
        // 步骤数据 [{title, desc/description, status, fail, iconName, iconUrl, disabled}]
        items: {
            type: Array,
            value: []
        },
        // 当前步骤，从 0 开始
        current: {
            type: Number,
            value: 0
        },
        // 方向 horizontal / vertical
        direction: {
            type: String,
            value: 'horizontal'
        },
        // 样式类型 default / dot
        type: {
            type: String,
            value: 'default'
        },
        // 当前步骤状态 process / finish / error / wait
        status: {
            type: String,
            value: 'process'
        },
        // 是否可点击切换步骤
        clickable: {
            type: Boolean,
            value: false
        },
        // 激活/完成色
        activeColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 未激活色
        inactiveColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 错误色
        errorColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 标题色
        titleColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 描述色
        descColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        }
    },
    data: {
        stepList: []
    },
    observers: {
        'items, current, status, type, activeColor, inactiveColor, errorColor': function() {
            this._buildSteps();
        }
    },
    lifetimes: {
        attached() {
            this._buildSteps();
        }
    },
    methods: {
        _getItemStatus(index, current, status, item) {
            if (item && item.status) {
                return item.status;
            }
            if (item && item.fail) {
                return 'error';
            }
            if (index < current) {
                return 'finish';
            }
            if (index === current) {
                if (status === 'error') return 'error';
                if (status === 'finish') return 'finish';
                if (status === 'wait') return 'wait';
                return 'process';
            }
            return 'wait';
        },

        _buildSteps() {
            const {
                items = [],
                current = 0,
                status = 'process',
                type = 'default',
                activeColor,
                inactiveColor,
                errorColor
            } = this.data;
            const isDot = type === 'dot';

            const stepList = (items || []).map((item, index) => {
                const stepStatus = this._getItemStatus(index, current, status, item);
                const desc = item.desc || item.description || '';
                let iconColor = inactiveColor;
                let iconBg = 'transparent';
                let lineColor = inactiveColor;

                if (isDot) {
                    // 小圆点：实心色块，无序号/图标
                    if (stepStatus === 'finish' || stepStatus === 'process') {
                        iconBg = activeColor;
                        iconColor = activeColor;
                    } else if (stepStatus === 'error') {
                        iconBg = errorColor;
                        iconColor = errorColor;
                    } else {
                        iconBg = inactiveColor;
                        iconColor = inactiveColor;
                    }
                } else if (stepStatus === 'finish') {
                    iconColor = COLOR.WHITE_COLOR;
                    iconBg = activeColor;
                    lineColor = activeColor;
                } else if (stepStatus === 'process') {
                    iconColor = COLOR.WHITE_COLOR;
                    iconBg = activeColor;
                    lineColor = inactiveColor;
                } else if (stepStatus === 'error') {
                    iconColor = COLOR.WHITE_COLOR;
                    iconBg = errorColor;
                    lineColor = inactiveColor;
                } else {
                    iconColor = inactiveColor;
                    iconBg = COLOR.WHITE_COLOR;
                    lineColor = inactiveColor;
                }

                // 连接线：已完成步骤之后的线用激活色
                if (index < current) {
                    lineColor = activeColor;
                } else if (isDot) {
                    lineColor = inactiveColor;
                }

                return {
                    ...item,
                    index,
                    title: item.title || '',
                    desc,
                    stepStatus,
                    iconColor,
                    iconBg,
                    lineColor,
                    num: index + 1,
                    isLast: index === items.length - 1,
                    disabled: !!item.disabled
                };
            });

            this.setData({stepList});
        },

        handleTap(e) {
            const {index, item} = e.currentTarget.dataset;
            if (!this.data.clickable || !item || item.disabled) {
                return;
            }
            if (index === this.data.current) {
                return;
            }
            this.setData({current: index});
            this.triggerEvent('steps_change', {
                current: index,
                item,
                status: item.stepStatus
            });
        }
    }
});
