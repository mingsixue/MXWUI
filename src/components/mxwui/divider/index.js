import {COLOR} from '../utils/common';

const DIRECTION_LIST = ['horizontal', 'vertical'];
const POSITION_LIST = ['left', 'center', 'right'];
const LINE_TYPE_LIST = ['solid', 'dashed', 'dotted'];

Component({
    options: {
        // 去掉组件外层节点，保证在 flex / 行内布局中能正确垂直居中
        virtualHost: true
    },
    properties: {
        // 方向：horizontal / vertical
        direction: {
            type: String,
            value: 'horizontal'
        },
        // 分割线文字
        text: {
            type: String,
            value: ''
        },
        // 文字位置：left / center / right
        textPosition: {
            type: String,
            value: 'center'
        },
        // 文字颜色
        textColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        },
        // 文字字号，单位 rpx
        textSize: {
            type: null,
            value: 28
        },
        // 文字自定义样式
        textStyle: {
            type: String,
            value: ''
        },
        // 分割线颜色
        lineColor: {
            type: String,
            value: COLOR.BORDER_COLOR
        },
        // 水平分割线高度（粗细），单位 rpx
        lineHeight: {
            type: null,
            value: 2
        },
        // 竖直分割线宽度（粗细），单位 rpx
        lineWidth: {
            type: null,
            value: 2
        },
        // 分割线类型：solid / dashed / dotted
        lineType: {
            type: String,
            value: 'solid'
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        resolvedDirection: 'horizontal',
        resolvedPosition: 'center',
        hasText: false,
        leftLineStyle: '',
        rightLineStyle: '',
        textNodeStyle: '',
        rootStyle: ''
    },
    observers: {
        'direction, text, textPosition, textColor, textSize, textStyle, lineColor, lineHeight, lineWidth, lineType, customStyle': function () {
            this._syncStyle();
        }
    },
    attached() {
        this._syncStyle();
    },
    methods: {
        _resolveDirection(direction) {
            if (DIRECTION_LIST.indexOf(direction) >= 0) return direction;
            return 'horizontal';
        },

        _resolvePosition(position) {
            if (POSITION_LIST.indexOf(position) >= 0) return position;
            return 'center';
        },

        _resolveLineType(lineType) {
            if (LINE_TYPE_LIST.indexOf(lineType) >= 0) return lineType;
            return 'solid';
        },

        _resolveNumber(val, fallback) {
            const num = Number(val);
            if (Number.isNaN(num) || num < 0) return fallback;
            return num;
        },

        _buildLineBorder(thickness, lineType, lineColor) {
            return `border-bottom:${thickness}rpx ${lineType} ${lineColor};`;
        },

        _syncStyle() {
            const {
                direction,
                text,
                textPosition,
                textColor,
                textSize,
                textStyle,
                lineColor,
                lineHeight,
                lineWidth,
                lineType,
                customStyle
            } = this.data;

            const resolvedDirection = this._resolveDirection(direction);
            const resolvedPosition = this._resolvePosition(textPosition);
            const resolvedLineType = this._resolveLineType(lineType);
            const resolvedLineColor = lineColor || COLOR.BORDER_COLOR;
            const thickness = this._resolveNumber(lineHeight, 2);
            const width = this._resolveNumber(lineWidth, 2);
            const size = this._resolveNumber(textSize, 28);
            const hasText = !!(text && String(text).length);
            const rootStyle = customStyle || '';

            if (resolvedDirection === 'vertical') {
                this.setData({
                    resolvedDirection,
                    resolvedPosition,
                    hasText: false,
                    leftLineStyle: '',
                    rightLineStyle: '',
                    textNodeStyle: '',
                    rootStyle: [
                        `border-right:${width}rpx ${resolvedLineType} ${resolvedLineColor};`,
                        rootStyle
                    ].join('')
                });
                return;
            }

            const lineBorder = this._buildLineBorder(thickness, resolvedLineType, resolvedLineColor);

            if (!hasText) {
                this.setData({
                    resolvedDirection,
                    resolvedPosition,
                    hasText: false,
                    leftLineStyle: `flex:1;${lineBorder}`,
                    rightLineStyle: '',
                    textNodeStyle: '',
                    rootStyle
                });
                return;
            }

            let leftFlex = 'flex:1;';
            let rightFlex = 'flex:1;';

            if (resolvedPosition === 'left') {
                leftFlex = 'flex:0.15;';
                rightFlex = 'flex:1;';
            } else if (resolvedPosition === 'right') {
                leftFlex = 'flex:1;';
                rightFlex = 'flex:0.15;';
            }

            this.setData({
                resolvedDirection,
                resolvedPosition,
                hasText: true,
                leftLineStyle: `${leftFlex}${lineBorder}`,
                rightLineStyle: `${rightFlex}${lineBorder}`,
                textNodeStyle: [
                    `color:${textColor || COLOR.MINOR_TEXT_COLOR};`,
                    `font-size:${size}rpx;`,
                    textStyle || ''
                ].join(''),
                rootStyle
            });
        }
    }
});
