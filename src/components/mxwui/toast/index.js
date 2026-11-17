const TYPE_ICON_MAP = {
    success: 'radio_right_checked',
    error: 'close_fill',
    warning: 'warning_fill'
};

const TYPE_LIST = ['success', 'error', 'warning', 'loading'];
const TEXT_TYPE_LIST = ['short', 'long'];

Component({
    properties: {
        // 是否显示
        visible: {
            type: Boolean,
            value: false
        },
        // 文本内容
        content: {
            type: String,
            value: ''
        },
        // 内置图标类型：success / error / warning / loading
        type: {
            type: String,
            value: ''
        },
        // 自定义图标，优先于 image / type，使用 Icon 组件 name
        icon: {
            type: String,
            value: ''
        },
        // 自定义图片，与 icon 互斥，icon 优先
        image: {
            type: String,
            value: ''
        },
        // 持续时间（毫秒），为 0 时不自动关闭
        time: {
            type: null,
            value: 2000
        },
        // 持续时间（毫秒），传入后覆盖 time；为 0 时不自动关闭
        duration: {
            type: null,
            value: null
        },
        // 是否展示蒙层
        showMask: {
            type: Boolean,
            value: false
        },
        // 点击蒙层是否关闭
        maskCloseable: {
            type: Boolean,
            value: false
        },
        // 蒙层自定义样式
        maskStyle: {
            type: String,
            value: ''
        },
        // 文字气泡圆角类型：short 更大圆角 / long 常规圆角
        textType: {
            type: String,
            value: 'long'
        },
        // 层级
        zIndex: {
            type: Number,
            value: 999
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        show: false,
        displayContent: '',
        resolvedTextType: 'long',
        hasMedia: false,
        mediaKind: '', // icon | image | loading
        mediaIcon: '',
        mediaImage: ''
    },
    observers: {
        visible(visible) {
            if (visible) {
                this._handleShow();
            } else if (this.data.show) {
                this._handleClose(false);
            }
        },
        'content, type, icon, image, textType': function () {
            this._syncDisplay();
        }
    },
    lifetimes: {
        attached() {
            this._syncDisplay();
            if (this.data.visible) {
                this._handleShow();
            }
        },
        detached() {
            this._clearTimer();
        }
    },
    methods: {
        _clearTimer() {
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
            }
        },

        _resolveTextType(textType) {
            if (TEXT_TYPE_LIST.indexOf(textType) >= 0) {
                return textType;
            }
            return 'long';
        },

        // 解析关闭延时：duration 若传入则优先生效，否则用 time，单位均为毫秒
        _resolveDelayMs() {
            const {time, duration} = this.data;
            if (duration !== null && duration !== '' && typeof duration !== 'undefined') {
                const ms = Number(duration);
                if (!Number.isNaN(ms) && ms >= 0) {
                    return ms;
                }
            }
            const ms = Number(time);
            if (!Number.isNaN(ms) && ms >= 0) {
                return ms;
            }
            return 2000;
        },

        _syncDisplay() {
            const {content, type, icon, image, textType} = this.data;
            let displayContent = '';
            if (typeof content === 'string' && content) {
                // 最多 24 个字符，超出截断并补省略号
                displayContent = content.length > 24
                    ? `${content.substring(0, 24)}...`
                    : content;
            }
            const resolvedTextType = this._resolveTextType(textType);

            let hasMedia = false;
            let mediaKind = '';
            let mediaIcon = '';
            let mediaImage = '';

            if (icon) {
                hasMedia = true;
                mediaKind = 'icon';
                mediaIcon = icon;
            } else if (image) {
                hasMedia = true;
                mediaKind = 'image';
                mediaImage = image;
            } else if (TYPE_LIST.indexOf(type) >= 0) {
                hasMedia = true;
                if (type === 'loading') {
                    mediaKind = 'loading';
                } else {
                    mediaKind = 'icon';
                    mediaIcon = TYPE_ICON_MAP[type];
                }
            }

            this.setData({
                displayContent,
                resolvedTextType,
                hasMedia,
                mediaKind,
                mediaIcon,
                mediaImage
            });
        },

        _handleShow() {
            this._clearTimer();
            this._syncDisplay();
            this.setData({
                show: true
            });

            const delay = this._resolveDelayMs();
            if (delay > 0) {
                this._timer = setTimeout(() => {
                    this._handleClose(true);
                }, delay);
            }
        },

        _handleClose(fromInner) {
            if (!this.data.show) {
                return;
            }
            this._clearTimer();
            const next = {
                show: false
            };
            if (fromInner) {
                next.visible = false;
            }
            this.setData(next);
            this.triggerEvent('toast_close');
        },

        handleMaskTap() {
            if (this.data.showMask && this.data.maskCloseable) {
                this._handleClose(true);
            }
        },

        preventTouchMove() {}
    }
});
