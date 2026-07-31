import {COLOR} from '../utils/common';

let canvasSeed = 0;

Component({
    properties: {
        // 画板高度，单位 rpx
        height: {
            type: Number,
            value: 400
        },
        // 笔迹颜色
        penColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 笔迹宽度，单位 px
        penWidth: {
            type: Number,
            value: 3
        },
        // 背景色
        bgColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        // 禁用书写
        disabled: {
            type: Boolean,
            value: false
        },
        // 只读
        readonly: {
            type: Boolean,
            value: false
        },
        // 空态提示文案
        placeholder: {
            type: String,
            value: '请在此签名'
        },
        // 是否显示清除按钮
        showClear: {
            type: Boolean,
            value: true
        },
        // 清除按钮文案
        clearText: {
            type: String,
            value: '清除'
        },
        // 是否显示确认按钮
        showConfirm: {
            type: Boolean,
            value: false
        },
        // 确认按钮文案
        confirmText: {
            type: String,
            value: '确认'
        },
        // 导出图片类型：png / jpg
        fileType: {
            type: String,
            value: 'png'
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        canvasId: '',
        canvasWidth: 0,
        canvasHeight: 0,
        isEmpty: true
    },
    observers: {
        'height, bgColor': function () {
            this._scheduleMeasure();
        }
    },
    lifetimes: {
        created() {
            canvasSeed += 1;
            this._canvasId = `mx-signature-${canvasSeed}`;
            this._drawing = false;
            this._lastPoint = null;
            this._measureToken = 0;
            this._canvas = null;
            this._ctx = null;
            this._dpr = 1;
        },
        attached() {
            this.setData({canvasId: this._canvasId}, () => {
                this._ready = true;
                this._scheduleMeasure();
            });
        },
        ready() {
            this._scheduleMeasure();
        },
        detached() {
            this._ready = false;
            this._clearTimers();
            this._canvas = null;
            this._ctx = null;
        }
    },
    methods: {
        _clearTimers() {
            if (this._measureTimer) {
                clearTimeout(this._measureTimer);
                this._measureTimer = null;
            }
            if (this._exportTimer) {
                clearTimeout(this._exportTimer);
                this._exportTimer = null;
            }
        },

        _isLocked() {
            return this.data.disabled || this.data.readonly;
        },

        _getPixelRatio() {
            try {
                const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
                return Math.min(Math.max(Number(info.pixelRatio) || 2, 1), 3);
            } catch (e) {
                return 2;
            }
        },

        _scheduleMeasure() {
            if (!this._ready) return;
            if (this._measureTimer) clearTimeout(this._measureTimer);
            this._measureTimer = setTimeout(() => {
                this._measureTimer = null;
                this._measureCanvas();
            }, 50);
        },

        _measureCanvas() {
            const token = ++this._measureToken;
            this.createSelectorQuery()
                .in(this)
                .select('.mx-signature-board')
                .boundingClientRect((rect) => {
                    if (token !== this._measureToken || !rect || !rect.width || !rect.height) return;
                    const canvasWidth = Math.max(1, Math.floor(rect.width));
                    const canvasHeight = Math.max(1, Math.floor(rect.height));
                    const sizeChanged =
                        canvasWidth !== this.data.canvasWidth ||
                        canvasHeight !== this.data.canvasHeight;

                    if (!sizeChanged && this._inited) return;

                    this._canvas = null;
                    this._ctx = null;
                    this._inited = false;
                    this._boardRect = rect;
                    this.setData({canvasWidth, canvasHeight}, () => {
                        // 等待 canvas 节点挂载后再初始化
                        setTimeout(() => {
                            if (token !== this._measureToken) return;
                            this._initCanvas(token);
                        }, 50);
                    });
                })
                .exec();
        },

        _initCanvas(token) {
            const canvasId = this._canvasId || this.data.canvasId;
            const {canvasWidth, canvasHeight, bgColor, isEmpty} = this.data;
            if (!canvasId || !canvasWidth || !canvasHeight) return;

            this.createSelectorQuery()
                .in(this)
                .select(`#${canvasId}`)
                .fields({node: true, size: true})
                .exec((res) => {
                    if (token != null && token !== this._measureToken) return;
                    const canvas = res && res[0] && res[0].node;
                    if (!canvas) return;

                    const dpr = this._getPixelRatio();
                    canvas.width = canvasWidth * dpr;
                    canvas.height = canvasHeight * dpr;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.scale(dpr, dpr);
                    this._canvas = canvas;
                    this._ctx = ctx;
                    this._dpr = dpr;
                    this._drawing = false;
                    this._lastPoint = null;

                    ctx.fillStyle = bgColor || COLOR.WHITE_COLOR;
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                    this._inited = true;
                    if (!isEmpty) {
                        this.setData({isEmpty: true});
                        this.triggerEvent('signature_change', {empty: true});
                    }
                });
        },

        _applyPenStyle(ctx) {
            const penWidth = Number(this.data.penWidth) || 3;
            ctx.strokeStyle = this.data.penColor || COLOR.TEXT_COLOR;
            ctx.fillStyle = this.data.penColor || COLOR.TEXT_COLOR;
            ctx.lineWidth = penWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        },

        _getTouchPoint(e) {
            const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
            if (!touch) return null;
            // type=2d 时优先使用相对画布坐标
            if (typeof touch.x === 'number' && typeof touch.y === 'number') {
                return {x: touch.x, y: touch.y};
            }
            const rect = this._boardRect;
            if (rect && typeof touch.clientX === 'number') {
                return {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                };
            }
            return null;
        },

        handleTouchStart(e) {
            if (this._isLocked() || !this._inited || !this._ctx) return;
            const point = this._getTouchPoint(e);
            if (!point) return;

            this._drawing = true;
            this._moved = false;
            this._lastPoint = point;

            const ctx = this._ctx;
            this._applyPenStyle(ctx);
            const radius = Math.max(0.5, (Number(this.data.penWidth) || 3) / 2);
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();

            const wasEmpty = this.data.isEmpty;
            if (wasEmpty) {
                this.setData({isEmpty: false});
                this.triggerEvent('signature_change', {empty: false});
            }
            this.triggerEvent('signature_start', {x: point.x, y: point.y});
        },

        handleTouchMove(e) {
            if (!this._drawing || this._isLocked() || !this._lastPoint || !this._ctx) return;
            const point = this._getTouchPoint(e);
            if (!point) return;

            const ctx = this._ctx;
            this._moved = true;
            this._applyPenStyle(ctx);
            ctx.beginPath();
            ctx.moveTo(this._lastPoint.x, this._lastPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            this._lastPoint = point;
            this.triggerEvent('signature_signing', {x: point.x, y: point.y});
        },

        handleTouchEnd() {
            if (!this._drawing) return;
            this._drawing = false;
            this._lastPoint = null;
            this.triggerEvent('signature_end', {
                empty: this.data.isEmpty,
                moved: !!this._moved
            });
            this._moved = false;
        },

        handleClearTap() {
            this.clear();
        },

        handleConfirmTap() {
            this.confirm();
        },

        // 清空签名
        clear() {
            const ctx = this._ctx;
            const {canvasWidth, canvasHeight, bgColor, isEmpty} = this.data;
            if (!ctx || !canvasWidth || !canvasHeight) return;

            this._drawing = false;
            this._lastPoint = null;
            ctx.fillStyle = bgColor || COLOR.WHITE_COLOR;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            if (!isEmpty) {
                this.setData({isEmpty: true});
                this.triggerEvent('signature_change', {empty: true});
            }
            this.triggerEvent('signature_clear');
        },

        // 是否为空
        isEmpty() {
            return !!this.data.isEmpty;
        },

        // 导出临时图片路径
        toTempFilePath(options = {}) {
            return new Promise((resolve, reject) => {
                const canvas = this._canvas;
                const {canvasWidth, canvasHeight, fileType, isEmpty} = this.data;
                if (!canvas || !canvasWidth || !canvasHeight) {
                    const err = {errMsg: 'signature: canvas not ready'};
                    if (typeof options.fail === 'function') options.fail(err);
                    if (typeof options.complete === 'function') options.complete(err);
                    reject(err);
                    return;
                }

                const exportType = options.fileType || fileType || 'png';
                const quality = options.quality != null ? options.quality : 1;

                const doExport = () => {
                    wx.canvasToTempFilePath({
                        canvas,
                        x: 0,
                        y: 0,
                        width: canvasWidth,
                        height: canvasHeight,
                        destWidth: canvasWidth * this._dpr,
                        destHeight: canvasHeight * this._dpr,
                        fileType: exportType === 'jpg' ? 'jpg' : 'png',
                        quality,
                        success: (res) => {
                            const detail = {
                                tempFilePath: res.tempFilePath,
                                empty: isEmpty
                            };
                            if (typeof options.success === 'function') options.success(detail);
                            if (typeof options.complete === 'function') options.complete(detail);
                            resolve(detail);
                        },
                        fail: (err) => {
                            if (typeof options.fail === 'function') options.fail(err);
                            if (typeof options.complete === 'function') options.complete(err);
                            reject(err);
                        }
                    }, this);
                };

                // 等待尚未刷完的笔迹落盘
                if (this._exportTimer) clearTimeout(this._exportTimer);
                this._exportTimer = setTimeout(() => {
                    this._exportTimer = null;
                    doExport();
                }, 50);
            });
        },

        // 确认并导出
        confirm() {
            return this.toTempFilePath().then((detail) => {
                this.triggerEvent('signature_confirm', detail);
                return detail;
            }).catch((err) => {
                this.triggerEvent('signature_confirm', {
                    tempFilePath: '',
                    empty: this.data.isEmpty,
                    error: err
                });
                return Promise.reject(err);
            });
        }
    }
});
