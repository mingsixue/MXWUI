import {COLOR} from '../utils/common';
import createDialogBehavior from '../behaviors/dialog';

Component({
    behaviors: [createDialogBehavior('dialog_close')],
    properties: {
        // 标题
        title: {
            type: String,
            value: ''
        },
        // 标题文本色
        titleColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 内容
        content: {
            type: String,
            value: ''
        },
        // 内容文本色
        contentColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 是否显示确认按钮
        confirmBtn: {
            type: Boolean,
            value: true
        },
        // 确认按钮文案
        confirmBtnText: {
            type: String,
            value: '确定'
        },
        // 确认按钮文本色
        confirmBtnColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 是否显示取消按钮
        cancelBtn: {
            type: Boolean,
            value: false
        },
        // 取消按钮文案
        cancelBtnText: {
            type: String,
            value: '取消'
        },
        // 取消按钮文本色
        cancelBtnColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        },
    },
    methods: {
        handleMask() {
            this.closeByMask();
        },
        handleCancel() {
            this.triggerEvent("dialog_close", {type: 'cancel'});
        },
        handleConfirm() {
            this.triggerEvent("dialog_confirm");
        }
    }
});
