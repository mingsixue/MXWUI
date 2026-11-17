import {COLOR, hexToRGBA} from '../utils/common';

let canvasSeed = 0;
const DEFAULT_FONT_COLOR = hexToRGBA(COLOR.TEXT_COLOR, 0.15);

Component({
    properties: {
        // 水印文案，支持字符串或字符串数组（多行）
        content: {
            type: null,
            value: 'MXWUI'
        },
        // 图片水印地址，优先于 content
        image: {
            type: String,
            value: ''
        },
        // 水印单元宽度，单位 px
        width: {
            type: null,
            value: 120
        },
        // 水印单元高度，单位 px
        height: {
            type: null,
            value: 64
        },
        // 旋转角度，单位 deg
        rotate: {
            type: null,
            value: -22
        },
        // 层级
        zIndex: {
            type: null,
            value: 9
        },
        // 水印水平间距，单位 px
        gapX: {
            type: null,
            value: 24
        },
        // 水印垂直间距，单位 px
        gapY: {
            type: null,
            value: 48
        },
        // 文字字号，单位 px
        fontSize: {
            type: null,
            value: 14
        },
        // 文字颜色
        fontColor: {
            type: String,
            value: DEFAULT_FONT_COLOR
        },
        // 文字字重
        fontWeight: {
            type: String,
            value: 'normal'
        },
        // 图片水印宽度，单位 px
        imageWidth: {
            type: null,
            value: 120
        },
        // 图片水印高度，单位 px
        imageHeight: {
            type: null,
            value: 64
        },
        // 图片水印透明度，范围 0-1
        opacity: {
            type: null,
            value: 1
        },
        // 是否全屏覆盖页面
        fullPage: {
            type: Boolean,
            value: true
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        canvasId: '',
        canvasWidth: 1,
        canvasHeight: 1,
        rootStyle: '',
        layerStyle: ''
    },
    observers: {
        'content, image, width, height, rotate, zIndex, gapX, gapY, fontSize, fontColor, fontWeight, imageWidth, imageHeight, opacity, fullPage, customStyle': function () {
            this._scheduleRender();
        }
    },
    lifetimes: {
        created() {
            canvasSeed += 1;
            this._canvasId = `mx-water-mark-${canvasSeed}`;
            this._renderToken = 0;
        },
        attached() {
            this.setData({canvasId: this._canvasId}, () => {
                this._ready = true;
                this._scheduleRender();
            });
        },
        detached() {
            this._ready = false;
            this._clearTimers();
            this.ctx = null;
        }
    },
    methods: {
        _clearTimers() {
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = null;
            }
            if (this._drawDelayTimer) {
                clearTimeout(this._drawDelayTimer);
                this._drawDelayTimer = null;
            }
        },

        _resolveNumber(val, fallback) {
            const num = Number(val);
            if (Number.isNaN(num)) return fallback;
            return num;
        },

        _resolveOpacity(val, fallback) {
            const num = Number(val);
            if (Number.isNaN(num)) return fallback;
            if (num < 0) return 0;
            if (num > 1) return 1;
            return num;
        },

        _normalizeContent(content) {
            if (Array.isArray(content)) {
                return content.map((item) => String(item == null ? '' : item)).filter((item) => item.length);
            }
            if (content == null || content === '') return [];
            return String(content).split('\n').filter((item) => item.length);
        },

        _scheduleRender() {
            if (!this._ready) return;
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._debounceTimer = null;
                this._render();
            }, 16);
        },

        _getCtx() {
            const canvasId = this._canvasId || this.data.canvasId;
            if (!canvasId) return null;
            if (!this.ctx) {
                this.ctx = wx.createCanvasContext(canvasId, this);
            }
            return this.ctx;
        },

        _buildRootStyle() {
            const {customStyle} = this.data;
            return customStyle || '';
        },

        _buildLayerStyle(tileUrl, tileW, tileH, zIndex) {
            const styles = [
                `z-index:${zIndex};`,
                `background-size:${tileW}px ${tileH}px;`
            ];
            if (tileUrl) {
                // 引号包裹，兼容 base64 与含特殊字符的路径
                styles.unshift(`background-image:url("${tileUrl}");`);
            }
            return styles.join('');
        },

        // iOS 真机无法将 wxfile:// 临时路径用作 CSS background-image，需转 base64
        _tempPathToDataUrl(tempFilePath) {
            if (!tempFilePath) return '';
            if (/^data:image\//.test(tempFilePath)) return tempFilePath;
            try {
                const fs = wx.getFileSystemManager();
                const base64 = fs.readFileSync(tempFilePath, 'base64');
                return base64 ? `data:image/png;base64,${base64}` : tempFilePath;
            } catch (e) {
                return tempFilePath;
            }
        },

        _render() {
            const {
                content,
                image,
                width,
                height,
                rotate,
                zIndex,
                gapX,
                gapY,
                fontSize,
                fontColor,
                fontWeight,
                imageWidth,
                imageHeight,
                opacity
            } = this.data;

            const lines = this._normalizeContent(content);
            const hasImage = !!(image && String(image).length);
            const markW = Math.max(1, this._resolveNumber(width, 120));
            const markH = Math.max(1, this._resolveNumber(height, 64));
            const gapXVal = Math.max(0, this._resolveNumber(gapX, 24));
            const gapYVal = Math.max(0, this._resolveNumber(gapY, 48));
            const rotateVal = this._resolveNumber(rotate, -22);
            const zIndexVal = this._resolveNumber(zIndex, 9);
            const tileW = markW + gapXVal;
            const tileH = markH + gapYVal;
            const rootStyle = this._buildRootStyle();

            if (!hasImage && !lines.length) {
                this.setData({
                    rootStyle,
                    layerStyle: this._buildLayerStyle('', tileW, tileH, zIndexVal),
                    canvasWidth: 1,
                    canvasHeight: 1
                });
                return;
            }

            const token = ++this._renderToken;
            const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
            const ratio = Math.min(Math.max(Number(sys.pixelRatio) || 2, 1), 3);
            const canvasWidth = Math.ceil(tileW * ratio);
            const canvasHeight = Math.ceil(tileH * ratio);

            this.setData({
                rootStyle,
                canvasWidth,
                canvasHeight
            }, () => {
                if (token !== this._renderToken) return;
                // 画布尺寸变化后重建上下文，避免沿用旧 canvas 实例
                this.ctx = null;

                if (hasImage) {
                    this._drawImageMark({
                        token,
                        image,
                        markW,
                        markH,
                        tileW,
                        tileH,
                        rotateVal,
                        zIndexVal,
                        ratio,
                        canvasWidth,
                        canvasHeight,
                        imageWidth: Math.max(1, this._resolveNumber(imageWidth, markW)),
                        imageHeight: Math.max(1, this._resolveNumber(imageHeight, markH)),
                        opacity: this._resolveOpacity(opacity, 1)
                    });
                    return;
                }

                this._drawTextMark({
                    token,
                    lines,
                    tileW,
                    tileH,
                    rotateVal,
                    zIndexVal,
                    ratio,
                    canvasWidth,
                    canvasHeight,
                    fontSize: Math.max(1, this._resolveNumber(fontSize, 14)),
                    fontColor: fontColor || DEFAULT_FONT_COLOR,
                    fontWeight: fontWeight || 'normal'
                });
            });
        },

        _drawTextMark(opts) {
            const {
                token,
                lines,
                tileW,
                tileH,
                rotateVal,
                zIndexVal,
                ratio,
                canvasWidth,
                canvasHeight,
                fontSize,
                fontColor,
                fontWeight
            } = opts;
            const ctx = this._getCtx();
            if (!ctx) return;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.save();
            ctx.scale(ratio, ratio);
            ctx.translate(tileW / 2, tileH / 2);
            ctx.rotate((Math.PI / 180) * rotateVal);
            ctx.setFillStyle(fontColor);
            ctx.setTextAlign('center');
            ctx.setTextBaseline('middle');
            ctx.setFontSize(fontSize);
            ctx.font = `${fontWeight} ${fontSize}px sans-serif`;

            const lineHeight = fontSize * 1.4;
            const startY = -((lines.length - 1) * lineHeight) / 2;
            lines.forEach((line, index) => {
                ctx.fillText(line, 0, startY + index * lineHeight);
            });
            ctx.restore();

            this._exportTile(token, tileW, tileH, zIndexVal);
        },

        _drawImageMark(opts) {
            const {
                token,
                image,
                markW,
                markH,
                tileW,
                tileH,
                rotateVal,
                zIndexVal,
                ratio,
                canvasWidth,
                canvasHeight,
                imageWidth,
                imageHeight,
                opacity
            } = opts;

            wx.getImageInfo({
                src: image,
                success: (info) => {
                    if (token !== this._renderToken) return;
                    const ctx = this._getCtx();
                    if (!ctx) return;

                    const drawW = Math.min(imageWidth, markW);
                    const drawH = Math.min(imageHeight, markH);

                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                    ctx.save();
                    ctx.scale(ratio, ratio);
                    ctx.translate(tileW / 2, tileH / 2);
                    ctx.rotate((Math.PI / 180) * rotateVal);
                    ctx.setGlobalAlpha(opacity);
                    ctx.drawImage(info.path, -drawW / 2, -drawH / 2, drawW, drawH);
                    ctx.restore();

                    this._exportTile(token, tileW, tileH, zIndexVal);
                },
                fail: () => {
                    if (token !== this._renderToken) return;
                    this.setData({
                        layerStyle: this._buildLayerStyle('', tileW, tileH, zIndexVal)
                    });
                }
            });
        },

        _exportTile(token, tileW, tileH, zIndexVal) {
            const ctx = this._getCtx();
            const canvasId = this._canvasId || this.data.canvasId;
            if (!ctx || !canvasId) return;

            ctx.draw(false, () => {
                if (this._drawDelayTimer) clearTimeout(this._drawDelayTimer);
                this._drawDelayTimer = setTimeout(() => {
                    this._drawDelayTimer = null;
                    if (token !== this._renderToken) return;

                    wx.canvasToTempFilePath({
                        canvasId,
                        x: 0,
                        y: 0,
                        width: this.data.canvasWidth,
                        height: this.data.canvasHeight,
                        destWidth: this.data.canvasWidth,
                        destHeight: this.data.canvasHeight,
                        fileType: 'png',
                        success: (res) => {
                            if (token !== this._renderToken) return;
                            const tileUrl = this._tempPathToDataUrl(res.tempFilePath);
                            this.setData({
                                layerStyle: this._buildLayerStyle(tileUrl, tileW, tileH, zIndexVal)
                            });
                        },
                        fail: () => {
                            if (token !== this._renderToken) return;
                            this.setData({
                                layerStyle: this._buildLayerStyle('', tileW, tileH, zIndexVal)
                            });
                        }
                    }, this);
                }, 80);
            });
        }
    }
});
