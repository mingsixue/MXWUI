Component({
    properties: {
        // 吸顶高度，需带单位，如 100px、24rpx
        top: {
            type: String,
            value: ''
        },
        // 是否吸顶
        sticky: {
            type: Boolean,
            value: true
        },
        // 是否感知吸顶状态（有一定性能开销）
        check: {
            type: Boolean,
            value: false
        },
        // 透明头模式：自动按导航栏高度吸附
        transparentTitle: {
            type: Boolean,
            value: false
        },
        // 外部传入头部高度（px），优先于自动计算
        headerHeight: {
            type: null,
            value: null
        },
        // 吸顶时 z-index
        zIndex: {
            type: null,
            value: 99
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        },
    },
    data: {
        stickyStyle: '',
        checkStyle: '',
        _headerHeight: 91,
    },
    observers: {
        'top, sticky, check, transparentTitle, headerHeight, zIndex, customStyle': function () {
            this._sync();
        }
    },
    attached() {
        this._sync();
    },
    ready() {
        if (this.data.check && this.data.sticky) {
            this._initStickyObserver();
        }
    },
    detached() {
        this._disconnectStickyObserver();
    },
    methods: {
        _getDefaultHeaderHeight() {
            try {
                const {statusBarHeight} = wx.getSystemInfoSync();
                return (statusBarHeight || 47) + 44;
            } catch (e) {
                return 91;
            }
        },

        _resolveHeaderHeight() {
            const {headerHeight} = this.data;
            if (headerHeight !== null && headerHeight !== undefined && headerHeight !== '') {
                const num = Number(headerHeight);
                if (!Number.isNaN(num) && num >= 0) {
                    return num;
                }
            }
            return this._getDefaultHeaderHeight();
        },

        _buildTopStyle(headerHeightPx) {
            const {transparentTitle, top} = this.data;
            let style = '';
            if (transparentTitle) {
                style += `top:${headerHeightPx}px;`;
            }
            if (top) {
                style += `top:${top};`;
            }
            return style;
        },

        _sync() {
            const {sticky, check, transparentTitle, zIndex, customStyle} = this.data;
            let headerHeightPx = this.data._headerHeight;

            if (transparentTitle) {
                headerHeightPx = this._resolveHeaderHeight();
                if (headerHeightPx !== this.data._headerHeight) {
                    this.setData({_headerHeight: headerHeightPx});
                }
                if (this._headerHeightEmitted !== headerHeightPx) {
                    this._headerHeightEmitted = headerHeightPx;
                    this.triggerEvent('get_header_height', {height: headerHeightPx});
                }
            }

            const topStyle = this._buildTopStyle(headerHeightPx);
            const z = Number(zIndex);
            const zStyle = !Number.isNaN(z) ? `z-index:${z};` : '';
            const stickyStyle = `${topStyle}${zStyle}${customStyle || ''}`;
            const checkStyle = topStyle;

            this.setData({stickyStyle, checkStyle});

            if (sticky && check) {
                if (!this._stickyIO) {
                    // ready 之后再初始化；attached 阶段节点可能尚未就绪
                    wx.nextTick(() => {
                        this._initStickyObserver();
                    });
                }
            } else {
                this._disconnectStickyObserver();
            }
        },

        _initStickyObserver() {
            if (!this.data.check || !this.data.sticky) return;
            this._disconnectStickyObserver();

            try {
                this._stickyIO = this.createIntersectionObserver({
                    thresholds: [0, 0.01, 1],
                });
                this._stickyIO
                    .relativeTo('.mx-sticky-check')
                    .observe('.mx-sticky', (res) => {
                        const status = !!(res && res.intersectionRatio > 0);
                        if (status !== this._lastStickyStatus) {
                            this._lastStickyStatus = status;
                            this.triggerEvent('sticky_change', {status});
                        }
                    });
            } catch (e) {
                // ignore
            }
        },

        _disconnectStickyObserver() {
            if (this._stickyIO) {
                try {
                    this._stickyIO.disconnect();
                } catch (e) {
                    // ignore
                }
                this._stickyIO = null;
                this._lastStickyStatus = undefined;
            }
        },
    }
});
