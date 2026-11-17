const TYPE_LIST = ['dot', 'number', 'text', 'bubble'];
const POSITION_LIST = [
    'top-left',
    'top-center',
    'top-right',
    'left',
    'right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
];

function resolveType(type) {
    if (TYPE_LIST.indexOf(type) >= 0) return type;
    return 'dot';
}

function resolvePosition(position) {
    if (POSITION_LIST.indexOf(position) >= 0) return position;
    return 'top-right';
}

function resolveOffset(val, fallback) {
    if (val === null || val === undefined || val === '') return fallback;
    return String(val);
}

function buildPositionStyle(position, offsetX, offsetY) {
    const x = resolveOffset(offsetX, '-50%');
    const y = resolveOffset(offsetY, '-50%');
    const transform = `transform:translate(${x}, ${y});`;
    switch (position) {
        case 'top-left':
            return `top:0;left:0;${transform}`;
        case 'top-center':
            return `top:0;left:50%;${transform}`;
        case 'top-right':
            return `top:0;left:100%;${transform}`;
        case 'left':
            return `top:50%;left:0;${transform}`;
        case 'right':
            return `top:50%;left:100%;${transform}`;
        case 'bottom-left':
            return `top:100%;left:0;${transform}`;
        case 'bottom-center':
            return `top:100%;left:50%;${transform}`;
        case 'bottom-right':
            return `top:100%;left:100%;${transform}`;
        default:
            return `top:0;left:100%;${transform}`;
    }
}

function buildBubbleStyle(type, position) {
    if (type !== 'bubble') return '';
    switch (position) {
        case 'top-left':
            return 'border-bottom-right-radius:0;';
        case 'top-right':
            return 'border-bottom-left-radius:0;';
        case 'bottom-left':
            return 'border-top-right-radius:0;';
        case 'bottom-right':
            return 'border-top-left-radius:0;';
        default:
            return '';
    }
}

function isOverCount(text) {
    const num = Number(text);
    return !Number.isNaN(num) && num >= 100;
}

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 徽标类型：dot 红点 / number 数字 / text 文字 / bubble 气泡
        type: {
            type: String,
            value: 'dot'
        },
        // 徽标内容；数字超过 99 显示 99+
        text: {
            type: null,
            value: ''
        },
        // 徽标相对容器位置
        position: {
            type: String,
            value: 'top-right'
        },
        // 水平偏移，如 -50% / -20rpx / 2px
        offsetX: {
            type: null,
            value: '-50%'
        },
        // 垂直偏移
        offsetY: {
            type: null,
            value: '-50%'
        },
        // 是否描边
        stroke: {
            type: Boolean,
            value: false
        },
        // 自定义背景色
        bgColor: {
            type: String,
            value: ''
        },
        // 自定义文字色
        textColor: {
            type: String,
            value: ''
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        resolvedType: 'dot',
        displayText: '',
        contentStyle: '',
        badgeStyle: '',
        strokeClass: '',
        rootStyle: ''
    },
    observers: {
        'type, text, position, offsetX, offsetY, stroke, bgColor, textColor, customStyle': function () {
            this._syncView();
        }
    },
    attached() {
        this._syncView();
    },
    methods: {
        _syncView() {
            const {
                type,
                text,
                position,
                offsetX,
                offsetY,
                stroke,
                bgColor,
                textColor,
                customStyle
            } = this.data;

            const resolvedType = resolveType(type);
            const resolvedPosition = resolvePosition(position);
            const isOver = resolvedType === 'number' && isOverCount(text);
            const displayText = isOver
                ? '99+'
                : (text === null || text === undefined ? '' : String(text));

            const styleParts = [buildPositionStyle(resolvedPosition, offsetX, offsetY)];
            styleParts.push(buildBubbleStyle(resolvedType, resolvedPosition));

            let badgeStyle = '';
            if (resolvedType === 'dot') {
                if (bgColor) badgeStyle = `background-color:${bgColor};`;
            } else {
                if (bgColor) styleParts.push(`background-color:${bgColor};`);
                if (textColor) styleParts.push(`color:${textColor};`);
            }

            this.setData({
                resolvedType,
                displayText,
                contentStyle: styleParts.join(''),
                badgeStyle,
                rootStyle: customStyle || '',
                strokeClass: stroke
                    ? (resolvedType === 'dot' ? 'mx-badge-dot-stroke' : 'mx-badge-content-stroke')
                    : ''
            });
        }
    }
});
