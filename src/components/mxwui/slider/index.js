import {COLOR} from '../utils/common';

Component({
    properties: {
        // 当前值：单滑块 Number，双滑块 [Number, Number]
        value: {
            type: null,
            value: null
        },
        // 非受控初始值
        defaultValue: {
            type: null,
            value: null
        },
        min: {
            type: Number,
            value: 0
        },
        max: {
            type: Number,
            value: 100
        },
        step: {
            type: Number,
            value: 1
        },
        disabled: {
            type: Boolean,
            value: false
        },
        // 双滑块模式
        range: {
            type: Boolean,
            value: false
        },
        // 显示刻度点
        showTicks: {
            type: Boolean,
            value: false
        },
        // 显示刻度数值
        showNumber: {
            type: Boolean,
            value: false
        },
        // 拖动时显示悬浮提示
        showTooltip: {
            type: Boolean,
            value: false
        },
        activeColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        inactiveColor: {
            type: String,
            value: COLOR.SOFT_BG_COLOR
        },
        handleColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        activeLineStyle: {
            type: String,
            value: ''
        },
        activeDotStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        innerValue: 0,
        tipStart: 0,
        tipEnd: 0,
        sliderLeft: 0,
        sliderWidth: 0,
        handlerRight: 0,
        tickList: [],
        changingStart: false,
        changingEnd: false,
        trackId: ''
    },
    observers: {
        'value, defaultValue, min, max, step, range, showTicks, showNumber': function() {
            if (this._dragging) return;
            this._syncFromProps();
        }
    },
    lifetimes: {
        attached() {
            this.setData({
                trackId: `mx-slider-${Date.now()}-${Math.floor(Math.random() * 10000)}`
            });
            this._syncFromProps();
        }
    },
    methods: {
        _isControlled() {
            return this.properties.value !== null && this.properties.value !== undefined;
        },

        _getSourceValue() {
            if (this._isControlled()) {
                return this.properties.value;
            }
            if (this._inited) {
                return this.data.innerValue;
            }
            const {defaultValue, range, min} = this.data;
            if (defaultValue !== null && defaultValue !== undefined) {
                return defaultValue;
            }
            return range ? [min, min] : min;
        },

        _syncFromProps() {
            const value = this._formatValue(this._getSourceValue());
            this._inited = true;
            this._applyValue(value, {emit: false});
        },

        _getDecimals(step) {
            const str = String(step);
            const idx = str.indexOf('.');
            return idx === -1 ? 0 : str.length - idx - 1;
        },

        _roundByStep(num, step) {
            const decimals = this._getDecimals(step);
            const rounded = Math.round(Number(num) / step) * step;
            return Number(rounded.toFixed(decimals));
        },

        _clamp(num, min, max) {
            return Math.min(max, Math.max(min, num));
        },

        _fitValue(val) {
            const {min, max, range} = this.data;
            if (val === null || val === undefined) {
                return range ? [min, min] : min;
            }
            if (!range) {
                const n = Number(val);
                return this._clamp(Number.isNaN(n) ? min : n, min, max);
            }
            let a;
            let b;
            if (Array.isArray(val)) {
                a = Number(val[0]);
                b = Number(val[1]);
            } else {
                a = min;
                b = Number(val);
            }
            if (Number.isNaN(a)) a = min;
            if (Number.isNaN(b)) b = min;
            a = this._clamp(a, min, max);
            b = this._clamp(b, min, max);
            return a <= b ? [a, b] : [b, a];
        },

        _formatValue(val) {
            const {step, range} = this.data;
            const fitted = this._fitValue(val);
            if (!range) {
                return this._roundByStep(fitted, step);
            }
            return [
                this._roundByStep(fitted[0], step),
                this._roundByStep(fitted[1], step)
            ];
        },

        _isEqual(a, b) {
            if (a === b) return true;
            if (Array.isArray(a) && Array.isArray(b)) {
                return a[0] === b[0] && a[1] === b[1];
            }
            return false;
        },

        _calcStyle(roundedValue) {
            const {min, max} = this.data;
            const span = max - min || 1;
            let leftValue = min;
            let rightValue = min;
            if (typeof roundedValue === 'number') {
                rightValue = roundedValue;
            } else if (Array.isArray(roundedValue)) {
                leftValue = roundedValue[0];
                rightValue = roundedValue[1];
            }
            return {
                sliderLeft: ((leftValue - min) / span) * 100,
                sliderWidth: ((rightValue - leftValue) / span) * 100
            };
        },

        _buildTicks(sliderLeft, sliderWidth) {
            const {step, min, max, showTicks} = this.data;
            if (!showTicks) return [];
            const span = max - min || 1;
            const stepCount = Math.round(span / step);
            const tickList = [];
            for (let i = 0; i <= stepCount; i += 1) {
                const value = this._roundByStep(min + i * step, step);
                const left = ((value - min) / span) * 100;
                tickList.push({
                    left,
                    value,
                    active: left >= sliderLeft - 0.001 && left <= sliderLeft + sliderWidth + 0.001
                });
            }
            return tickList;
        },

        _applyValue(rawValue, {emit = false} = {}) {
            const value = this._formatValue(rawValue);
            const style = this._calcStyle(value);
            const tipStart = Array.isArray(value) ? value[0] : value;
            const tipEnd = Array.isArray(value) ? value[1] : value;
            this.setData({
                innerValue: value,
                tipStart,
                tipEnd,
                sliderLeft: style.sliderLeft,
                sliderWidth: style.sliderWidth,
                handlerRight: style.sliderLeft + style.sliderWidth,
                tickList: this._buildTicks(style.sliderLeft, style.sliderWidth)
            });
            if (emit && !this._isEqual(this._lastEmitValue, value)) {
                this._lastEmitValue = Array.isArray(value) ? value.slice() : value;
                this.triggerEvent('slider_change', {value});
            }
            return value;
        },

        _getTouchValue(e) {
            return new Promise((resolve) => {
                const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
                if (!touch) {
                    resolve(null);
                    return;
                }
                const query = this.createSelectorQuery();
                query.select(`#${this.data.trackId}`).boundingClientRect();
                query.exec((res) => {
                    const rect = res && res[0];
                    if (!rect || !rect.width) {
                        resolve(null);
                        return;
                    }
                    const {min, max} = this.data;
                    let ratio = (touch.clientX - rect.left) / rect.width;
                    ratio = this._clamp(ratio, 0, 1);
                    resolve(min + ratio * (max - min));
                });
            });
        },

        async _onTouchChanged(e, type) {
            if (this.data.disabled) return;

            const touchValue = await this._getTouchValue(e);
            if (touchValue === null) return;

            this._dragging = type !== 'end';
            const {range} = this.data;
            let nextValue;

            if (!range) {
                nextValue = touchValue;
                this.setData({
                    changingEnd: type !== 'end',
                    changingStart: false
                });
            } else {
                const current = this._formatValue(this.data.innerValue);
                const leftValue = current[0];
                const rightValue = current[1];
                const moveRight = Math.abs(leftValue - touchValue) > Math.abs(rightValue - touchValue);
                if (moveRight) {
                    nextValue = [leftValue, touchValue];
                    this.setData({
                        changingEnd: type !== 'end',
                        changingStart: false
                    });
                } else {
                    nextValue = [touchValue, rightValue];
                    this.setData({
                        changingStart: type !== 'end',
                        changingEnd: false
                    });
                }
            }

            const value = this._applyValue(nextValue, {emit: true});

            if (type === 'end') {
                this._dragging = false;
                this.setData({changingStart: false, changingEnd: false});
                this.triggerEvent('slider_afterchange', {value});
            }
        },

        handleTouchStart(e) {
            this._onTouchChanged(e, 'start');
        },

        handleTouchMove(e) {
            this._onTouchChanged(e, 'move');
        },

        handleTouchEnd(e) {
            this._onTouchChanged(e, 'end');
        }
    }
});
