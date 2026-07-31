import {COLOR, hexToRGBA} from '../utils/common';

const Empty = 'checkbox_empty';
const Checked = 'checkbox_checked';

Component({
    properties: {
        // 文案
        text: {
            type: String,
            value: ''
        },
        // 文案颜色
        textColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 是否选中
        checked: {
            type: Boolean,
            value: false
        },
        // 是否禁用
        disabled: {
            type: Boolean,
            value: false,
            observer(newVal) {
                this.applyDisabledColor(newVal);
            }
        },
        // 复选框位置，after / before
        checkboxPosition: {
            type: String,
            value: 'before'
        },
        // 复选框未选中颜色
        checkboxColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 复选框选中颜色
        checkboxSelectColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 复选框大小
        checkboxSize: {
            type: Number,
            value: 48
        },
        Empty: {
            type: String,
            value: Empty
        },
        Checked: {
            type: String,
            value: Checked
        },
    },
    lifetimes: {
        attached() {
            this._originCheckboxColor = this.data.checkboxColor;
            this._originCheckboxSelectColor = this.data.checkboxSelectColor;
            if (this.data.disabled) {
                this.applyDisabledColor(true);
            }
        },
    },
    methods: {
        applyDisabledColor(disabled) {
            if (disabled) {
                if (!this._originCheckboxColor) {
                    this._originCheckboxColor = this.data.checkboxColor;
                    this._originCheckboxSelectColor = this.data.checkboxSelectColor;
                }
                this.setData({
                    checkboxColor: hexToRGBA(this._originCheckboxColor, 0.5),
                    checkboxSelectColor: hexToRGBA(this._originCheckboxSelectColor, 0.5),
                });
                return;
            }
            if (this._originCheckboxColor) {
                this.setData({
                    checkboxColor: this._originCheckboxColor,
                    checkboxSelectColor: this._originCheckboxSelectColor,
                });
            }
        },
        handleCheckbox() {
            if (this.data.disabled) {
                return;
            }

            let checked = !this.data.checked;
            this.setData({
                checked: checked
            });
            this.triggerEvent("checkbox_change", {checked: checked});
        },
    }
});
