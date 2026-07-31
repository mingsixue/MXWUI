import {COLOR} from '../utils/common';

const SUCCESS_COLOR = COLOR.SWITCH_COLOR;
const EXCEPTION_COLOR = COLOR.THEME_COLOR;
const ANIMATION_FRAME = 16;
let canvasSeed = 0;

Component({
    properties: {
        // 当前进度，范围 0-100
        percent: {
            type: null,
            value: 0
        },
        // 类型：line / circle
        type: {
            type: String,
            value: 'line'
        },
        // 状态，仅限 line：success / exception
        status: {
            type: String,
            value: ''
        },
        // 进度条颜色
        strokeColor: {
            type: String,
            value: ''
        },
        // 轨道颜色
        trailColor: {
            type: String,
            value: COLOR.SOFT_BG_COLOR
        },
        // 进度条宽度，单位 px
        strokeWidth: {
            type: Number,
            value: 8
        },
        // 圆形进度条画布宽度，单位 px
        width: {
            type: Number,
            value: 100
        },
        // 是否显示进度数值或状态图标
        showInfo: {
            type: Boolean,
            value: true
        },
        // 是否开启过渡动画
        animation: {
            type: Boolean,
            value: true
        },
        // 圆形进度条每次推进角度，默认 6deg
        speed: {
            type: Number,
            value: 6
        }
    },
    data: {
        curProgress: 0,
        canvasId: '',
        canvasWidth: 100,
        resolvedStrokeColor: COLOR.THEME_COLOR,
        lineBarStyle: '',
        lineOuterStyle: '',
        circleWrapStyle: '',
        statusIcon: '',
        statusIconColor: ''
    },
    observers: {
        'percent, type, status, strokeColor, trailColor, strokeWidth, width, showInfo, animation, speed': function() {
            this._syncProgress();
        }
    },
    lifetimes: {
        created() {
            canvasSeed += 1;
            this._canvasId = `mx-progress-bar-${canvasSeed}`;
        },
        attached() {
            this.setData({canvasId: this._canvasId}, () => {
                this._ready = true;
                this._syncProgress();
            });
        },
        detached() {
            this._clearTimer();
            this.ctx = null;
            this._ready = false;
        }
    },
    methods: {
        _clearTimer() {
            if (this._animTimer) {
                clearTimeout(this._animTimer);
                this._animTimer = null;
            }
            if (this._drawDelayTimer) {
                clearTimeout(this._drawDelayTimer);
                this._drawDelayTimer = null;
            }
        },

        _clampPercent(val) {
            const num = Number(val);
            if (Number.isNaN(num)) return 0;
            return Math.min(100, Math.max(0, num));
        },

        _resolveStrokeColor() {
            const {status, strokeColor} = this.data;
            if (strokeColor) return strokeColor;
            if (status === 'success') return SUCCESS_COLOR;
            if (status === 'exception') return EXCEPTION_COLOR;
            return COLOR.THEME_COLOR;
        },

        _buildLineStyles(percent, strokeColor) {
            const {strokeWidth, trailColor, animation, status} = this.data;
            const height = Number(strokeWidth) || 8;
            const outerParts = [`height:${height}px;`];
            if (trailColor) {
                outerParts.push(`background-color:${trailColor};`);
            }

            const barParts = [`width:${percent}%;`, `background-color:${strokeColor};`];
            if (!animation) {
                barParts.push('transition:none;');
            }

            let statusIcon = '';
            let statusIconColor = '';
            if (status === 'success') {
                statusIcon = 'success';
                statusIconColor = strokeColor;
            } else if (status === 'exception') {
                statusIcon = 'close_fill';
                statusIconColor = strokeColor;
            }

            return {
                lineOuterStyle: outerParts.join(''),
                lineBarStyle: barParts.join(''),
                statusIcon,
                statusIconColor
            };
        },

        _syncProgress() {
            const percent = this._clampPercent(this.data.percent);
            const strokeColor = this._resolveStrokeColor();
            const {type, width, status} = this.data;
            const prevProgress = this.data.curProgress;
            const lineStyles = this._buildLineStyles(percent, strokeColor);

            let statusIcon = lineStyles.statusIcon;
            let statusIconColor = lineStyles.statusIconColor;
            if (type === 'circle') {
                if (status === 'success') {
                    statusIcon = 'success';
                    statusIconColor = strokeColor;
                } else if (status === 'exception') {
                    statusIcon = 'close_fill';
                    statusIconColor = strokeColor;
                } else {
                    statusIcon = '';
                    statusIconColor = '';
                }
            }

            const size = Number(width) || 100;
            this.setData({
                curProgress: percent,
                resolvedStrokeColor: strokeColor,
                lineOuterStyle: lineStyles.lineOuterStyle,
                lineBarStyle: lineStyles.lineBarStyle,
                circleWrapStyle: `width:${size}px;height:${size}px;`,
                canvasWidth: size,
                statusIcon,
                statusIconColor
            });

            if (type === 'circle' && this._ready) {
                this._updateCanvasProgress(prevProgress, percent);
            } else {
                this._clearTimer();
            }
        },

        _getCanvasContext() {
            if (this.ctx) return this.ctx;
            const canvasId = this._canvasId || this.data.canvasId;
            if (!canvasId) return null;
            this.ctx = wx.createCanvasContext(canvasId, this);
            return this.ctx;
        },

        _clearCanvas() {
            const ctx = this._getCanvasContext();
            const {canvasWidth} = this.data;
            if (!ctx) return;
            ctx.clearRect(0, 0, canvasWidth, canvasWidth);
        },

        _drawOrbit(color) {
            const ctx = this._getCanvasContext();
            const {canvasWidth, strokeWidth} = this.data;
            if (!ctx) return;
            const lineWidth = Number(strokeWidth) || 8;
            ctx.beginPath();
            ctx.setStrokeStyle(color);
            ctx.setLineWidth(lineWidth);
            ctx.arc(
                canvasWidth / 2,
                canvasWidth / 2,
                Math.max(0, canvasWidth / 2 - lineWidth),
                0,
                Math.PI * 2,
                false
            );
            ctx.stroke();
        },

        _drawProgress(color, rad) {
            const ctx = this._getCanvasContext();
            const {canvasWidth, strokeWidth} = this.data;
            if (!ctx) return;
            const lineWidth = Number(strokeWidth) || 8;
            ctx.beginPath();
            ctx.setStrokeStyle(color);
            ctx.setLineWidth(lineWidth);
            ctx.setLineCap('round');
            ctx.arc(
                canvasWidth / 2,
                canvasWidth / 2,
                Math.max(0, canvasWidth / 2 - lineWidth),
                -Math.PI / 2,
                -Math.PI / 2 + (rad / 360) * 2 * Math.PI,
                false
            );
            ctx.stroke();
        },

        _updateCanvasProgress(prev, target) {
            this._clearTimer();
            // 画布尺寸变化后重建上下文
            this.ctx = null;
            const drawColor = {
                strokeColor: this._resolveStrokeColor(),
                trailColor: this.data.trailColor || COLOR.SOFT_BG_COLOR
            };

            const targetRad = Math.floor((this._clampPercent(target) / 100) * 360);
            const {animation, speed} = this.data;

            const paint = (rad) => {
                this._clearCanvas();
                this._drawOrbit(drawColor.trailColor);
                if (rad > 0) {
                    this._drawProgress(drawColor.strokeColor, rad);
                }
                const ctx = this._getCanvasContext();
                if (ctx) ctx.draw();
            };

            const run = () => {
                if (!animation) {
                    paint(targetRad);
                    return;
                }

                let curRad = Math.floor((this._clampPercent(prev) / 100) * 360);
                const direction = curRad < targetRad ? 1 : -1;
                const step = Math.max(1, Number(speed) || 6);

                const draw = () => {
                    if (curRad === targetRad) {
                        paint(targetRad);
                        return;
                    }

                    curRad += direction * step;
                    if (direction === -1) {
                        curRad = Math.max(curRad, targetRad);
                    } else {
                        curRad = Math.min(curRad, targetRad);
                    }

                    paint(curRad);
                    this._animTimer = setTimeout(draw, ANIMATION_FRAME);
                };

                draw();
            };

            // 等待 canvas 节点就绪
            this._drawDelayTimer = setTimeout(run, 50);
        }
    }
});
