import createDialogBehavior from '../behaviors/dialog';

Component({
    behaviors: [createDialogBehavior('popup_close')],
    properties: {
        // 弹窗方向：left / right
        type: {
            type: String,
            value: 'right'
        },
        // 自定义弹窗宽度
        width: {
            type: String,
            value: '80vw'
        },
    },
    methods: {
        handleMask() {
            // 兼容旧事件：popup 原先不带 type
            if (!this.data.isCloseMask) {
                return;
            }
            this.setData({ visible: false });
            this.triggerEvent("popup_close");
        },
    }
});
