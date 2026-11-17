import {COLOR} from '../utils/common';

Component({
    properties: {
        // 值
        value: {
            type: Number,
            value: 0,
            observer(newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }
                this.syncDisabled(newVal);
            },
        },
        // 最小值
        min: {
            type: Number,
            value: 0
        },
        // 最大值
        max: {
            type: Number,
            value: 9999
        },
        // 步长
        step: {
            type: Number,
            value: 1
        },
        // 是否禁用
        disabled: {
            type: Boolean,
            value: false
        },
        // 是否禁用输入框
        disabledInput: {
            type: Boolean,
            value: false
        },
        // 光标颜色
        cursorColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
    },
    lifetimes: {
        attached() {
            this.syncDisabled(this.data.value);
        },
    },
    methods: {
        clampValue(value) {
            const {min, max} = this.data;
            let next = Number(value);
            if (Number.isNaN(next)) {
                next = Number(min) || 0;
            }
            if (next > max) {
                next = max;
            }
            if (next < min) {
                next = min;
            }
            return next;
        },
        syncDisabled(value) {
            const {min, max, step} = this.data;
            const next = this.clampValue(value);
            this.setData({
                addDisabled: next + step > max,
                minusDisabled: next - step < min,
            });
            if (next !== value) {
                this.setData({ value: next });
            }
        },
        emitChange(value) {
            this.triggerEvent("stepper_change", {value});
        },
        handleMinus() {
            if (this.data.disabled || this.data.minusDisabled) {
                return;
            }
            const {value, step} = this.data;
            const newValue = this.clampValue(Number(value) - step);
            this.setData({
                value: newValue,
                minusDisabled: newValue - step < this.data.min,
                addDisabled: false,
            });
            this.emitChange(newValue);
        },
        handleAdd() {
            if (this.data.disabled || this.data.addDisabled) {
                return;
            }
            const {value, step} = this.data;
            const newValue = this.clampValue(Number(value) + step);
            this.setData({
                value: newValue,
                addDisabled: newValue + step > this.data.max,
                minusDisabled: false,
            });
            this.emitChange(newValue);
        },
        inputChange(e) {
            if (this.data.disabled || this.data.disabledInput) {
                return;
            }
            const newValue = this.clampValue(e.detail.value);
            this.setData({
                value: newValue,
                addDisabled: newValue + this.data.step > this.data.max,
                minusDisabled: newValue - this.data.step < this.data.min,
            });
            this.emitChange(newValue);
        }
    }
});
