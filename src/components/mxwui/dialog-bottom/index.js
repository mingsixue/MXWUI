import {COLOR} from '../utils/common';
import createDialogBehavior from '../behaviors/dialog';

Component({
    behaviors: [createDialogBehavior('dialog_bottom_close')],
    properties: {
        // 是否显示关闭按钮
        showClose: {
            type: Boolean,
            value: true
        },
        // 自定义高度
        height: {
            type: String,
            value: '65vh'
        },
        // 底部偏移（px），用于键盘顶起弹窗
        offsetBottom: {
            type: Number,
            value: 0
        },
        WHITE_COLOR: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
    },
    methods: {
        handleMask() {
            this.closeByMask();
        },
        handleClose() {
            this.closeByAction('close');
        },
        // 兼容旧拼写
        handleClsoe() {
            this.handleClose();
        }
    }
});
