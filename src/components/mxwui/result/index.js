import {COLOR} from '../utils/common';

const TYPE_MAP = {
    success: {icon: 'success', color: COLOR.SWITCH_COLOR},
    error: {icon: 'close_fill', color: COLOR.THEME_COLOR},
    info: {icon: 'explain_fill', color: '#1677FF'},
    warning: {icon: 'warning_fill', color: '#FF8F1F'},
    wait: {icon: 'wait', color: '#00B578'},
};

// 兼容 ant-design-mini 旧文档别名
const TYPE_ALIAS = {
    danger: 'error',
    warn: 'warning',
};

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 内置类型：success / error / info / warning / wait
        type: {
            type: String,
            value: ''
        },
        // 主文案
        title: {
            type: String,
            value: ''
        },
        // 主文案颜色
        titleColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 副文案
        message: {
            type: String,
            value: ''
        },
        // 副文案颜色
        messageColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        },
        // 自定义图片，type / icon 优先时不生效
        image: {
            type: String,
            value: ''
        },
        // 自定义图标（Icon name），优先于 type / image
        icon: {
            type: String,
            value: ''
        },
        // 图标颜色，传入后覆盖 type 默认色
        iconColor: {
            type: String,
            value: ''
        },
        // 图标/图片大小，单位 rpx
        iconSize: {
            type: Number,
            value: 128
        },
        // 操作按钮：[{ text, type, color }]
        buttons: {
            type: Array,
            value: []
        },
        // 距离顶部距离，单位 rpx
        top: {
            type: Number,
            value: 0
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        displayIcon: '',
        displayIconColor: '',
        showMedia: false
    },
    observers: {
        'type, icon, iconColor, image': function (type, icon, iconColor, image) {
            this._syncMedia(type, icon, iconColor, image);
        }
    },
    lifetimes: {
        attached() {
            const {type, icon, iconColor, image} = this.data;
            this._syncMedia(type, icon, iconColor, image);
        }
    },
    methods: {
        _normalizeType(type) {
            if (!type) return '';
            const key = TYPE_ALIAS[type] || type;
            return TYPE_MAP[key] ? key : '';
        },

        _syncMedia(type, icon, iconColor, image) {
            let displayIcon = '';
            let displayIconColor = iconColor || '';

            if (icon) {
                displayIcon = icon;
                if (!displayIconColor) {
                    displayIconColor = COLOR.PLACEHOLDER_COLOR;
                }
            } else {
                const normalized = this._normalizeType(type);
                if (normalized) {
                    displayIcon = TYPE_MAP[normalized].icon;
                    if (!displayIconColor) {
                        displayIconColor = TYPE_MAP[normalized].color;
                    }
                }
            }

            this.setData({
                displayIcon,
                displayIconColor,
                showMedia: !!(displayIcon || image)
            });
        },

        handleBtnTap(e) {
            const {item, index} = e.currentTarget.dataset;
            if (!item) return;
            this.triggerEvent('result_btn_tap', {
                item,
                index
            });
        }
    }
});
