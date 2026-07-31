import {COLOR} from '../utils/common';

const SIZE_LIST = ['small', 'medium', 'large', 'x-large'];
const DOT_SCALES = [1, 0.86, 0.72, 0.58, 0.44, 0.32, 0.22, 0.12];
const PETAL_COUNT = 12;
const TYPE_LIST = ['spin', 'mini', 'dot', 'petal'];

function normalizeHexColor(color) {
    if (typeof color !== 'string') return '';
    const val = color.trim();
    if (!val) return '';
    return val;
}

function resolveType(type) {
    if (TYPE_LIST.indexOf(type) >= 0) return type;
    return 'spin';
}

Component({
    properties: {
        // 加载样式类型：spin / mini / dot / petal
        type: {
            type: String,
            value: 'spin'
        },
        // 加载颜色
        color: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // spin / dot / petal 尺寸：small / medium / large / x-large
        size: {
            type: String,
            value: 'medium'
        },
        // spin 圆环粗细，单位 rpx
        strokeWidth: {
            type: null,
            value: 3
        },
        // dot / petal 旋转一周耗时，单位秒，越小越快
        speed: {
            type: null,
            value: 0.9
        },
        // 自定义根节点样式，可用于覆盖尺寸
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        resolvedType: 'spin',
        sizeClass: 'mx-loading-medium',
        spinIconStyle: '',
        miniItemStyle: '',
        dotItems: [],
        petalItems: [],
        rootStyle: ''
    },
    observers: {
        'type, color, size, strokeWidth, speed, customStyle': function () {
            this._syncStyle();
        }
    },
    attached() {
        this._syncStyle();
    },
    methods: {
        _resolveSizeClass(size) {
            if (SIZE_LIST.indexOf(size) >= 0) {
                return `mx-loading-${size}`;
            }
            return 'mx-loading-medium';
        },

        _resolveStrokeWidth(val) {
            const num = Number(val);
            if (Number.isNaN(num) || num <= 0) return 3;
            return num;
        },

        _resolveSpeed(val) {
            const num = Number(val);
            if (Number.isNaN(num) || num <= 0) return 0.9;
            return num;
        },

        _buildDotItems(color) {
            return DOT_SCALES.map((scale, index) => ({
                index,
                spokeStyle: `transform:rotate(${index * 45}deg);`,
                itemStyle: [
                    `background-color:${color};`,
                    `transform:translateX(-50%) scale(${scale});`
                ].join('')
            }));
        },

        _buildPetalItems(color) {
            const step = 360 / PETAL_COUNT;
            const items = [];
            for (let index = 0; index < PETAL_COUNT; index++) {
                // 头部最实，尾部渐隐
                const opacity = Number((1 - (index / PETAL_COUNT) * 0.92).toFixed(3));
                items.push({
                    index,
                    spokeStyle: `transform:rotate(${index * step}deg);`,
                    itemStyle: `background-color:${color};opacity:${opacity};`
                });
            }
            return items;
        },

        _syncStyle() {
            const {type, color, size, strokeWidth, speed, customStyle} = this.data;
            const resolvedType = resolveType(type);
            const resolvedColor = normalizeHexColor(color) || COLOR.THEME_COLOR;
            const sizeClass = this._resolveSizeClass(size);
            const width = this._resolveStrokeWidth(strokeWidth);

            let spinIconStyle = '';
            let miniItemStyle = '';
            let dotItems = [];
            let petalItems = [];
            let rootStyle = customStyle || '';

            if (resolvedType === 'mini') {
                miniItemStyle = `background-color:${resolvedColor};`;
            } else if (resolvedType === 'dot') {
                dotItems = this._buildDotItems(resolvedColor);
                rootStyle = `animation-duration:${this._resolveSpeed(speed)}s;${rootStyle}`;
            } else if (resolvedType === 'petal') {
                petalItems = this._buildPetalItems(resolvedColor);
                rootStyle = `animation-duration:${this._resolveSpeed(speed)}s;${rootStyle}`;
            } else {
                spinIconStyle = [
                    `border-width:${width}rpx;`,
                    `border-top-color:${resolvedColor};`,
                    `border-left-color:${resolvedColor};`,
                    'border-right-color:transparent;',
                    'border-bottom-color:transparent;'
                ].join('');
            }

            this.setData({
                resolvedType,
                sizeClass,
                spinIconStyle,
                miniItemStyle,
                dotItems,
                petalItems,
                rootStyle
            });
        }
    }
});
