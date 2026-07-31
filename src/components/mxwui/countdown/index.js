import {COLOR} from '../utils/common';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 结束时间戳（毫秒或秒），与 time 二选一
        countdownEndTime: {
            type: null,
            value: ''
        },
        // 起始时间戳（毫秒或秒），默认取本地当前时间
        countdownStartTime: {
            type: null,
            value: ''
        },
        // 倒计时时长，单位秒；未传 countdownEndTime 时生效
        time: {
            type: null,
            value: 0
        },
        // 类型：空为时分秒；day 时展示「天」
        countdownType: {
            type: String,
            value: ''
        },
        // 小于一天时是否自动隐藏「天」
        autoShowDay: {
            type: Boolean,
            value: true
        },
        // 前缀文案（也可用 slot="prefix"）
        prefix: {
            type: String,
            value: ''
        },
        // 后缀文案（也可用 slot="suffix"）
        suffix: {
            type: String,
            value: ''
        },
        // 整体文字颜色
        color: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        },
        // 数字颜色
        numberColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        // 数字背景色
        numberBg: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        countdownDay: '0',
        countdownHour: '00',
        countdownMin: '00',
        countdownSec: '00',
        showDay: false,
        rootStyle: '',
        numStyle: '',
        hourNumStyle: ''
    },
    observers: {
        'countdownEndTime, countdownStartTime, time': function () {
            this._restart();
        },
        'countdownType, autoShowDay': function () {
            if (typeof this._lastRemain === 'number') {
                this._applyRemain(this._lastRemain, true);
            } else {
                this._restart();
            }
        },
        'color, numberColor, numberBg, customStyle': function () {
            this._syncStyle();
        }
    },
    lifetimes: {
        attached() {
            this._syncStyle();
            this._restart();
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
            if (this._intervalId) {
                clearInterval(this._intervalId);
                this._intervalId = null;
            }
        },

        _syncStyle() {
            const {color, numberColor, numberBg, customStyle} = this.data;
            const rootParts = [];
            if (color) rootParts.push(`color:${color};`);
            if (customStyle) rootParts.push(customStyle);

            const numParts = [];
            if (numberColor) numParts.push(`color:${numberColor};`);
            if (numberBg) numParts.push(`background-color:${numberBg};`);

            this.setData({
                rootStyle: rootParts.join(''),
                numStyle: numParts.join('')
            });
        },

        _toMs(val) {
            if (val === '' || val === null || val === undefined) return NaN;
            const str = String(val).trim();
            if (!str) return NaN;
            const num = Number(str);
            if (Number.isNaN(num)) return NaN;
            // 10 位秒级时间戳自动补齐为毫秒
            if (str.length === 10) return num * 1000;
            return num;
        },

        _pad(num) {
            const n = Math.max(0, Math.floor(num));
            return n < 10 ? `0${n}` : `${n}`;
        },

        _digitBoxStyle(digitCount) {
            const digits = Math.max(2, digitCount || 2);
            if (digits <= 2) return '';
            const width = digits * 22;
            return `width:${width}rpx;min-width:${width}rpx;`;
        },

        _formatRemain(remainMs, countdownType) {
            const remain = Math.max(0, remainMs);
            const day = Math.floor(remain / DAY_MS);
            let hour;
            if (countdownType === 'day') {
                hour = Math.floor((remain % DAY_MS) / HOUR_MS);
            } else {
                hour = Math.floor(remain / HOUR_MS);
            }
            const min = Math.floor((remain % HOUR_MS) / MIN_MS);
            const sec = Math.floor((remain % MIN_MS) / 1000);

            return {
                day: String(day),
                hour: this._pad(hour),
                min: this._pad(min),
                sec: this._pad(sec)
            };
        },

        _resolveShowDay(day) {
            const {countdownType, autoShowDay} = this.data;
            if (countdownType !== 'day') return false;
            if (!autoShowDay) return true;
            return String(day) !== '0';
        },

        _emitTick(remainTime, parts) {
            this.triggerEvent('countdown_change', {
                remainTime,
                day: parts.day,
                hour: parts.hour,
                min: parts.min,
                sec: parts.sec
            });
        },

        _applyRemain(remainTime, skipEvent) {
            this._lastRemain = remainTime;
            const parts = this._formatRemain(remainTime, this.data.countdownType);
            const showDay = this._resolveShowDay(parts.day);

            this._maxHourDigits = Math.max(this._maxHourDigits || 2, parts.hour.length);

            this.setData({
                countdownDay: parts.day,
                countdownHour: parts.hour,
                countdownMin: parts.min,
                countdownSec: parts.sec,
                showDay,
                hourNumStyle: this._digitBoxStyle(this._maxHourDigits)
            });

            if (skipEvent) return;

            this._emitTick(remainTime, parts);

            if (remainTime < 1 && !this._finished) {
                this._finished = true;
                this.triggerEvent('countdown_finish');
            }
        },

        _restart() {
            this._clearTimer();
            this._finished = false;
            this._lastRemain = null;
            this._maxHourDigits = 2;
            this._initCountdown();
        },

        _initCountdown() {
            const {countdownStartTime, countdownEndTime, time} = this.data;
            const timeNum = Number(time);
            const durationSec = Number.isNaN(timeNum) ? 0 : Math.max(0, timeNum);

            let startMs = this._toMs(countdownStartTime);
            let endMs = this._toMs(countdownEndTime);

            if (Number.isNaN(startMs)) {
                startMs = Date.now();
            }
            if (Number.isNaN(endMs)) {
                endMs = Date.now() + durationSec * 1000;
            }

            this._runCountdown(startMs, endMs);
        },

        _runCountdown(startTimestamp, endTimestamp) {
            const currentTime = Date.now();
            const startDiff = Math.abs(currentTime - startTimestamp);

            // 服务端起始时间与本地相差 10s 内，以本地时间为准
            if (startDiff < 10000) {
                const getRemainingTime = () => {
                    const now = Date.now();
                    if (now >= endTimestamp) return 0;
                    return endTimestamp - now;
                };

                const tick = () => {
                    const remainingTime = getRemainingTime();
                    this._applyRemain(remainingTime);
                    if (remainingTime > 0) {
                        this._timer = setTimeout(tick, 1000);
                    }
                };

                const firstRemain = getRemainingTime();
                this._applyRemain(firstRemain);
                if (firstRemain > 0) {
                    this._timer = setTimeout(tick, 1000);
                }
                return;
            }

            // 否则按服务端起止时间差逐秒递减
            const remainingTime = Math.max(0, endTimestamp - startTimestamp);
            const totalCount = Math.round(remainingTime / 1000);
            let count = 0;

            this._applyRemain(remainingTime);

            if (totalCount <= 0) return;

            this._intervalId = setInterval(() => {
                count += 1;
                const next = Math.max(0, remainingTime - count * 1000);
                this._applyRemain(next);
                if (count >= totalCount) {
                    this._clearTimer();
                }
            }, 1000);
        }
    }
});
