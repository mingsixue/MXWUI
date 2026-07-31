/**
 * 弹层通用：visible / zIndex / isCloseMask + 关闭
 * @param {string} closeEvent 关闭事件名，如 dialog_close / popup_close
 */
export default function createDialogBehavior(closeEvent) {
    return Behavior({
        properties: {
            visible: {
                type: Boolean,
                value: false,
            },
            zIndex: {
                type: Number,
                value: 1,
            },
            isCloseMask: {
                type: Boolean,
                value: true,
            },
        },
        methods: {
            closeByMask() {
                if (!this.data.isCloseMask) {
                    return;
                }
                this.setData({ visible: false });
                this.triggerEvent(closeEvent, { type: 'maskClose' });
            },
            closeByAction(type = 'close') {
                this.setData({ visible: false });
                this.triggerEvent(closeEvent, { type });
            },
        },
    });
}
