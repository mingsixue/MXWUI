import {COLOR, hexToRGBA} from '../utils/common';
import createDialogBehavior from '../behaviors/dialog';

Component({
    behaviors: [createDialogBehavior('protocol_dialog_close')],
    properties: {
        // 标题
        title: {
            type: String,
            value: '用户协议',
        },
        // 是否显示标题
        showTitle: {
            type: Boolean,
            value: true,
        },
        // 标题文本色
        titleColor: {
            type: String,
            value: COLOR.TEXT_COLOR,
        },
        // 内容
        content: {
            type: String,
            value: '',
        },
        // 内容文本色
        contentColor: {
            type: String,
            value: COLOR.TEXT_COLOR,
        },
        // 是否显示确认按钮
        confirmBtn: {
            type: Boolean,
            value: true,
        },
        // 确认按钮文案
        confirmBtnText: {
            type: String,
            value: '同意',
        },
        // 确认按钮文本色
        confirmBtnColor: {
            type: String,
            value: COLOR.THEME_COLOR,
        },
        // 是否显示取消按钮
        cancelBtn: {
            type: Boolean,
            value: true,
        },
        // 取消按钮文案
        cancelBtnText: {
            type: String,
            value: '取消',
        },
        // 取消按钮文本色
        cancelBtnColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR,
        },
        // 是否强制阅读
        forceRead: {
            type: Boolean,
            value: false,
        },
        // 强制阅读模式：time 倒计时 / scroll 滑动到底
        forceReadType: {
            type: String,
            value: 'time',
        },
        // 强制阅读秒数（forceReadType=time 时生效）
        readSeconds: {
            type: Number,
            value: 5,
        },
        // 协议弹窗默认不可点蒙层关闭
        isCloseMask: {
            type: Boolean,
            value: false,
        },
    },
    data: {
        remainSeconds: 0,
        confirmDisabled: false,
        displayConfirmText: '同意',
        confirmStyle: '',
        scrollTop: 0,
        isScrollReadMode: false,
    },
    observers: {
        'visible, forceRead, forceReadType, readSeconds, confirmBtnText, confirmBtnColor'(
            visible,
            forceRead,
            forceReadType,
            readSeconds,
            confirmBtnText,
            confirmBtnColor
        ) {
            if (visible) {
                this._startForceRead(forceRead, forceReadType, readSeconds, confirmBtnText, confirmBtnColor);
            } else {
                this._clearForceReadTimer();
                this._scrollReadFinished = false;
                this._resetConfirmState(confirmBtnText, confirmBtnColor, false);
                this.setData({isScrollReadMode: false, scrollTop: 0});
            }
        },
    },
    detached() {
        this._clearForceReadTimer();
    },
    methods: {
        _clearForceReadTimer() {
            if (this._forceReadTimer) {
                clearInterval(this._forceReadTimer);
                this._forceReadTimer = null;
            }
        },
        _resetConfirmState(confirmBtnText, confirmBtnColor, disabled) {
            this.setData({
                remainSeconds: 0,
                confirmDisabled: disabled,
                displayConfirmText: confirmBtnText,
                confirmStyle: disabled
                    ? `color:${hexToRGBA(confirmBtnColor || COLOR.THEME_COLOR, 0.4)};`
                    : `color:${confirmBtnColor || COLOR.THEME_COLOR};`,
            });
        },
        _enableConfirm(confirmBtnText, confirmBtnColor) {
            this._resetConfirmState(
                confirmBtnText || this.data.confirmBtnText,
                confirmBtnColor || this.data.confirmBtnColor,
                false
            );
        },
        _startForceRead(forceRead, forceReadType, readSeconds, confirmBtnText, confirmBtnColor) {
            this._clearForceReadTimer();
            this._scrollReadFinished = false;

            if (!forceRead) {
                this._resetConfirmState(confirmBtnText, confirmBtnColor, false);
                this.setData({isScrollReadMode: false, scrollTop: 0});
                return;
            }

            const type = forceReadType === 'scroll' ? 'scroll' : 'time';

            if (type === 'scroll') {
                this._scrollViewHeight = 0;
                this.setData({
                    isScrollReadMode: true,
                    scrollTop: 0,
                    remainSeconds: 0,
                    confirmDisabled: true,
                    displayConfirmText: confirmBtnText,
                    confirmStyle: `color:${hexToRGBA(confirmBtnColor || COLOR.THEME_COLOR, 0.4)};`,
                });
                // 重置滚动位置后再检测内容是否无需滚动
                wx.nextTick(() => {
                    this.setData({scrollTop: 0.01});
                    setTimeout(() => {
                        this._checkScrollContentHeight();
                    }, 50);
                });
                return;
            }

            this.setData({isScrollReadMode: false, scrollTop: 0});
            const seconds = Math.max(0, Number(readSeconds) || 0);
            if (seconds <= 0) {
                this._resetConfirmState(confirmBtnText, confirmBtnColor, false);
                return;
            }

            let remain = seconds;
            this.setData({
                remainSeconds: remain,
                confirmDisabled: true,
                displayConfirmText: `${confirmBtnText}(${remain}s)`,
                confirmStyle: `color:${hexToRGBA(confirmBtnColor || COLOR.THEME_COLOR, 0.4)};`,
            });

            this._forceReadTimer = setInterval(() => {
                remain -= 1;
                if (remain <= 0) {
                    this._clearForceReadTimer();
                    this._enableConfirm(confirmBtnText, confirmBtnColor);
                    this.triggerEvent('protocol_dialog_read_finish', {type: 'time'});
                    return;
                }
                this.setData({
                    remainSeconds: remain,
                    confirmDisabled: true,
                    displayConfirmText: `${confirmBtnText}(${remain}s)`,
                });
            }, 1000);
        },
        _checkScrollContentHeight() {
            if (!this.data.visible || !this.data.isScrollReadMode || this._scrollReadFinished) {
                return;
            }
            const query = this.createSelectorQuery();
            query.select('.mx-protocol-dialog-scroll').boundingClientRect();
            query.select('.mx-protocol-dialog-scroll-inner').boundingClientRect();
            query.exec((res) => {
                if (!res || !res[0] || !res[1]) {
                    return;
                }
                this._scrollViewHeight = res[0].height || 0;
                // 内容未超出可视区域，无需滑动即可完成阅读
                if (res[1].height <= res[0].height + 2) {
                    this._finishScrollRead();
                }
            });
        },
        _finishScrollRead() {
            if (this._scrollReadFinished || !this.data.confirmDisabled) {
                return;
            }
            this._scrollReadFinished = true;
            this._enableConfirm(this.data.confirmBtnText, this.data.confirmBtnColor);
            this.triggerEvent('protocol_dialog_read_finish', {type: 'scroll'});
        },
        handleScrollToLower() {
            if (!this.data.isScrollReadMode) {
                return;
            }
            this._finishScrollRead();
        },
        handleScroll(e) {
            if (!this.data.isScrollReadMode || this._scrollReadFinished) {
                return;
            }
            const {scrollTop, scrollHeight} = e.detail || {};
            if (typeof scrollTop !== 'number' || typeof scrollHeight !== 'number') {
                return;
            }
            const viewHeight = this._scrollViewHeight || 0;
            if (viewHeight > 0 && scrollTop + viewHeight >= scrollHeight - 4) {
                this._finishScrollRead();
            }
        },
        handleMask() {
            this.closeByMask();
        },
        handleCancel() {
            this._clearForceReadTimer();
            this._scrollReadFinished = false;
            this.setData({visible: false});
            this.triggerEvent('protocol_dialog_cancel');
            this.triggerEvent('protocol_dialog_close', {type: 'cancel'});
        },
        handleConfirm() {
            if (this.data.confirmDisabled) {
                return;
            }
            this._clearForceReadTimer();
            this._scrollReadFinished = false;
            this.setData({visible: false});
            this.triggerEvent('protocol_dialog_confirm');
        },
    },
});
