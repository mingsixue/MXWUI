Component({
    properties: {
        // 当前星级（受控）
        value: {
            type: Number,
            value: 0,
            observer(newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }
                this.updateStars(newVal);
            },
        },
        // star 总数
        count: {
            type: Number,
            value: 5,
            observer() {
                this.updateStars(this.data.value);
            },
        },
        // 是否允许半星
        allowHalf: {
            type: Boolean,
            value: false,
            observer() {
                this.updateStars(this.data.value);
            },
        },
        // 是否允许再次点击后清除
        allowClear: {
            type: Boolean,
            value: true,
        },
        // 只读，无法交互
        readonly: {
            type: Boolean,
            value: false,
        },
        // 间距，单位 rpx
        gutter: {
            type: Number,
            value: 8,
        },
        // 自定义字符（文本）；有值时优先于 icon
        character: {
            type: String,
            value: '',
        },
        // 自定义图标名称，默认收藏星标
        icon: {
            type: String,
            value: 'collect_checked',
        },
        // 选中颜色
        color: {
            type: String,
            value: '#FF9F18',
        },
        // 未选中颜色
        voidColor: {
            type: String,
            value: '#EEEEEE',
        },
        // 大小，单位 rpx
        size: {
            type: Number,
            value: 48,
        },
    },
    data: {
        stars: [],
        displayValue: null,
    },
    lifetimes: {
        attached() {
            this.updateStars(this.data.value);
        },
    },
    methods: {
        normalizeValue(val) {
            const {allowHalf, count} = this.data;
            let next = Number(val);
            if (Number.isNaN(next)) {
                next = 0;
            }
            if (next < 0) {
                next = 0;
            }
            if (next > count) {
                next = count;
            }
            if (allowHalf) {
                next = Math.round(next * 2) / 2;
            } else {
                next = Math.ceil(next);
            }
            return next;
        },
        getDisplayValue() {
            const {displayValue, value} = this.data;
            return displayValue != null ? displayValue : value;
        },
        updateStars(value) {
            const display = value != null ? value : this.getDisplayValue();
            const {count} = this.data;
            const stars = [];
            for (let i = 1; i <= count; i++) {
                let activeWidth = '0%';
                if (display >= i) {
                    activeWidth = '100%';
                } else if (display >= i - 0.5) {
                    activeWidth = '50%';
                }
                stars.push({
                    index: i,
                    halfValue: i - 0.5,
                    fullValue: i,
                    activeWidth,
                });
            }
            this.setData({stars});
        },
        emitChange(value) {
            this.triggerEvent('rate_change', {value});
        },
        applyRate(rate, options = {}) {
            const {emit = true, clearable = true} = options;
            const {readonly, allowClear, value} = this.data;
            if (readonly) {
                return;
            }
            let next = this.normalizeValue(rate);
            if (clearable && allowClear && next === this.normalizeValue(value)) {
                next = 0;
            }
            this.setData({value: next, displayValue: null});
            this.updateStars(next);
            if (emit && next !== value) {
                this.emitChange(next);
            }
        },
        handleTap(e) {
            if (this.data.readonly || this._moving || this._ignoreTap) {
                return;
            }
            const rate = Number(e.currentTarget.dataset.value);
            this.applyRate(rate);
        },
        rpxToPx(rpx) {
            try {
                const {windowWidth} = wx.getSystemInfoSync();
                return (rpx * windowWidth) / 750;
            } catch (err) {
                return rpx / 2;
            }
        },
        getRateFromClientX(clientX) {
            return new Promise((resolve) => {
                const query = this.createSelectorQuery();
                query.select('.mx-rate-container').boundingClientRect((rect) => {
                    if (!rect || !rect.width) {
                        resolve(0);
                        return;
                    }
                    const {count, gutter, allowHalf} = this.data;
                    const gutterPx = this.rpxToPx(gutter);
                    const halfRateWidth = (rect.width - (count - 1) * gutterPx) / count / 2;
                    const num = clientX - rect.left;
                    let halfRateCount = 0;
                    while (true) {
                        const val =
                            halfRateWidth * halfRateCount +
                            gutterPx * Math.floor(halfRateCount / 2);
                        if (halfRateCount >= count * 2 || num <= val) {
                            break;
                        }
                        halfRateCount += 1;
                    }
                    const rate = allowHalf
                        ? halfRateCount * 0.5
                        : Math.ceil(halfRateCount * 0.5);
                    resolve(rate);
                }).exec();
            });
        },
        async handleTouchStart() {
            if (this.data.readonly) {
                return;
            }
            this._moving = false;
            this._moveOrigin = this.data.value;
        },
        async handleTouchMove(e) {
            if (this.data.readonly) {
                return;
            }
            const touch = e.touches && e.touches[0];
            if (!touch) {
                return;
            }
            this._moving = true;
            const rate = await this.getRateFromClientX(touch.clientX);
            this.setData({displayValue: rate});
            this.updateStars(rate);
        },
        async handleTouchEnd(e) {
            if (this.data.readonly) {
                return;
            }
            if (!this._moving) {
                return;
            }
            const touch = (e.changedTouches && e.changedTouches[0]) || {};
            const rate = await this.getRateFromClientX(touch.clientX);
            const origin = this._moveOrigin;
            this._moving = false;
            this._moveOrigin = null;
            this._ignoreTap = true;
            setTimeout(() => {
                this._ignoreTap = false;
            }, 100);
            this.setData({displayValue: null, value: rate});
            this.updateStars(rate);
            if (rate !== origin) {
                this.emitChange(rate);
            }
        },
    },
});
