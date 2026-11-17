import {COLOR} from '../utils/common';

const DEFAULT_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function chunkKeys(list) {
    return [
        list.slice(0, 3),
        list.slice(3, 6),
        list.slice(6, 9),
    ];
}

function shuffleKeys(list) {
    const next = list.slice();
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = next[i];
        next[i] = next[j];
        next[j] = temp;
    }
    return next;
}

Component({
    options: {
        multipleSlots: true,
    },
    properties: {
        // 是否显示键盘
        visible: {
            type: Boolean,
            value: false,
            observer(newVal) {
                if (newVal) {
                    this.refreshKeys();
                }
            },
        },
        // 当前输入值（受控）
        value: {
            type: String,
            value: '',
        },
        // 功能模式：number 数字 / idcard 身份证号
        mode: {
            type: String,
            value: 'number',
        },
        // 是否展示小数点（mode=idcard 时无效）
        point: {
            type: Boolean,
            value: true,
        },
        // 最大输入长度，-1 不限制；idcard 默认 18
        maxLength: {
            type: Number,
            value: -1,
        },
        // 是否显示关闭箭头
        closeable: {
            type: Boolean,
            value: false,
        },
        // 确认按钮文案，有值时展示确认栏
        confirmText: {
            type: String,
            value: '',
        },
        // 确认按钮文本色
        confirmColor: {
            type: String,
            value: COLOR.THEME_COLOR,
        },
        // 按键是否震动
        vibrate: {
            type: Boolean,
            value: false,
        },
        // 是否开启底部安全区
        safeArea: {
            type: Boolean,
            value: true,
        },
        // 数字键是否乱序
        random: {
            type: Boolean,
            value: false,
            observer() {
                if (this.data.visible) {
                    this.refreshKeys();
                }
            },
        },
        // 是否禁用确认按钮
        confirmDisabled: {
            type: Boolean,
            value: false,
        },
        // 层级
        zIndex: {
            type: Number,
            value: 1000,
        },
        // 蒙层是否可以关闭键盘
        isCloseMask: {
            type: Boolean,
            value: true,
        },
        // 自定义类名
        className: {
            type: String,
            value: '',
        },
        TEXT_COLOR: {
            type: String,
            value: COLOR.TEXT_COLOR,
        },
        MINOR_TEXT_COLOR: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR,
        },
    },
    data: {
        displayArr: chunkKeys(DEFAULT_KEYS),
        hasConfirm: false,
        // 确认按钮逐字竖排
        confirmChars: [],
        // 左下角扩展键：'.' | 'X' | ''
        extraKey: '.',
        // 实际最大长度，-1 不限制
        limitLength: -1,
    },
    observers: {
        'confirmText, mode, point, maxLength'(confirmText, mode, point, maxLength) {
            this.syncModeState(confirmText, mode, point, maxLength);
        },
    },
    lifetimes: {
        attached() {
            this.refreshKeys();
            this.syncModeState(
                this.data.confirmText,
                this.data.mode,
                this.data.point,
                this.data.maxLength
            );
        },
    },
    methods: {
        syncModeState(confirmText, mode, point, maxLength) {
            const isIdCard = mode === 'idcard';
            let extraKey = '';
            if (isIdCard) {
                extraKey = 'X';
            } else if (point) {
                extraKey = '.';
            }

            let limitLength = typeof maxLength === 'number' ? maxLength : -1;
            if (isIdCard && (limitLength === -1 || limitLength === undefined || limitLength === null)) {
                limitLength = 18;
            }

            this.setData({
                hasConfirm: !!confirmText,
                confirmChars: confirmText ? String(confirmText).split('') : [],
                extraKey,
                limitLength,
            });
        },

        refreshKeys() {
            const keys = this.data.random ? shuffleKeys(DEFAULT_KEYS) : DEFAULT_KEYS.slice();
            this.setData({
                displayArr: chunkKeys(keys),
            });
        },

        vibrateShort() {
            if (!this.data.vibrate) {
                return;
            }
            if (typeof wx !== 'undefined' && wx.vibrateShort) {
                wx.vibrateShort({
                    type: 'light',
                });
            }
        },

        preventTouchMove() {},

        handleMaskTap() {
            if (!this.data.isCloseMask) {
                return;
            }
            this.closeKeyboard('maskClose');
        },

        handleCloseTap() {
            this.closeKeyboard('close');
        },

        closeKeyboard(type = 'close') {
            this.setData({
                visible: false,
            });
            this.triggerEvent('number_keyboard_close', {type});
        },

        tapKey(e) {
            const {key} = e.currentTarget.dataset;
            if (key === undefined || key === null || key === '') {
                return;
            }

            this.vibrateShort();

            const current = `${this.data.value || ''}`;

            if (key === 'del') {
                this.triggerEvent('number_keyboard_change', {
                    value: current.slice(0, -1),
                });
                return;
            }

            if (key === 'enter') {
                this.handleConfirm();
                return;
            }

            const next = `${current}${key}`;
            const {limitLength} = this.data;
            if (limitLength > -1 && next.length > limitLength) {
                return;
            }

            this.triggerEvent('number_keyboard_change', {
                value: next,
            });
        },

        handleConfirm() {
            if (this.data.confirmDisabled) {
                return;
            }
            this.triggerEvent('number_keyboard_confirm', {
                value: `${this.data.value || ''}`,
            });
            this.closeKeyboard('confirm');
        },
    },
});
