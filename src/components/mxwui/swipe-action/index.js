import {COLOR} from '../utils/common';

const THRESHOLD = 0.3;
const MIN_DISTANCE = 10;
const DEFAULT_BTN_WIDTH = 160;
const INSTANCES = [];

const TYPE_STYLE = {
    default: {bgColor: '#C8C9CC', color: '#FFFFFF'},
    primary: {bgColor: '#1677FF', color: '#FFFFFF'},
    danger: {bgColor: COLOR.THEME_COLOR, color: '#FFFFFF'}
};

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function normalizeButtons(list = []) {
    if (!Array.isArray(list)) return [];
    return list.map((item = {}) => {
        const type = item.type || 'default';
        const preset = TYPE_STYLE[type] || TYPE_STYLE.default;
        return {
            text: item.text || '',
            type,
            className: item.className || '',
            width: Number(item.width) > 0 ? Number(item.width) : DEFAULT_BTN_WIDTH,
            bgColor: item.bgColor || preset.bgColor,
            color: item.color || preset.color
        };
    });
}

function sumWidth(buttons = []) {
    return buttons.reduce((total, item) => total + (Number(item.width) || 0), 0);
}

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        leftButtons: {type: Array, value: []},
        rightButtons: {type: Array, value: []},
        left: {type: Array, value: []},
        right: {type: Array, value: []},
        autoClose: {type: Boolean, value: true},
        disabled: {type: Boolean, value: false},
        elasticity: {type: Boolean, value: true},
        damping: {type: Number, value: 70},
        swiped: {type: null, value: null},
        defaultSwiped: {type: null, value: ''},
        name: {type: null, value: ''},
        extra: {type: null, value: null},
        className: {type: String, value: ''}
    },
    data: {
        _leftButtons: [],
        _rightButtons: [],
        leftWidth: 0,
        rightWidth: 0,
        leftWidthRpx: 0,
        rightWidthRpx: 0,
        wrapperStyle: '',
        catchMove: false,
        opened: false
    },
    observers: {
        'leftButtons, rightButtons, left, right': function() {
            this._syncButtons();
        },
        swiped: function(val) {
            if (this.dragging) return;
            this._applySwiped(val);
        }
    },
    lifetimes: {
        created() {
            this.offset = 0;
            this.startOffset = 0;
            this.dragging = false;
            this.direction = '';
            this.startX = 0;
            this.startY = 0;
            this.deltaX = 0;
            this.deltaY = 0;
        },
        attached() {
            INSTANCES.push(this);
            this._rpxRatio = this._getRpxRatio();
            this._syncButtons();
        },
        ready() {
            this._syncButtons();
            const {swiped, defaultSwiped} = this.properties;
            const init = swiped !== null && swiped !== undefined ? swiped : defaultSwiped;
            if (init) this._applySwiped(init);
        },
        detached() {
            const idx = INSTANCES.indexOf(this);
            if (idx > -1) INSTANCES.splice(idx, 1);
        }
    },
    methods: {
        _getRpxRatio() {
            try {
                return wx.getSystemInfoSync().windowWidth / 750;
            } catch (e) {
                return 0.5;
            }
        },

        _rpxToPx(rpx) {
            return (Number(rpx) || 0) * (this._rpxRatio || this._getRpxRatio());
        },

        _getLeftSource() {
            const {leftButtons, left} = this.properties;
            if (Array.isArray(left) && left.length) return left;
            return Array.isArray(leftButtons) ? leftButtons : [];
        },

        _getRightSource() {
            const {rightButtons, right} = this.properties;
            if (Array.isArray(right) && right.length) return right;
            return Array.isArray(rightButtons) ? rightButtons : [];
        },

        _syncButtons() {
            const _leftButtons = normalizeButtons(this._getLeftSource());
            const _rightButtons = normalizeButtons(this._getRightSource());
            const leftWidthRpx = sumWidth(_leftButtons);
            const rightWidthRpx = sumWidth(_rightButtons);
            const leftWidth = this._rpxToPx(leftWidthRpx);
            const rightWidth = this._rpxToPx(rightWidthRpx);
            this.setData({
                _leftButtons,
                _rightButtons,
                leftWidthRpx,
                rightWidthRpx,
                leftWidth,
                rightWidth
            });
        },

        _applySwiped(target) {
            if (target === 'left') {
                this.swipeMove(this.data.leftWidth || 0);
            } else if (target === 'right') {
                this.swipeMove(-(this.data.rightWidth || 0));
            } else if (target === false || target === '' || target === null) {
                this.swipeMove(0);
            }
        },

        open(position = 'right') {
            const {leftWidth, rightWidth} = this.data;
            const offset = position === 'left' ? leftWidth : -rightWidth;
            this.swipeMove(offset);
            this.triggerEvent('swipe_end', {
                direction: position,
                swiped: true,
                name: this.properties.name,
                extra: this.properties.extra
            });
        },

        close() {
            this.swipeMove(0);
        },

        swipeMove(offset = 0) {
            const {leftWidth, rightWidth, elasticity, damping} = this.data;
            let next = clamp(offset, -rightWidth, leftWidth);

            if (this.dragging && elasticity) {
                const resist = Math.max(10, Number(damping) || 70) / 100;
                if (offset > leftWidth && leftWidth > 0) {
                    next = leftWidth + (offset - leftWidth) * resist * 0.35;
                } else if (offset < -rightWidth && rightWidth > 0) {
                    next = -rightWidth + (offset + rightWidth) * resist * 0.35;
                }
            }

            this.offset = next;
            const transform = `translate3d(${next}px, 0, 0)`;
            const transition = this.dragging
                ? 'none'
                : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1)';

            this.setData({
                wrapperStyle: [
                    `-webkit-transform:${transform}`,
                    `transform:${transform}`,
                    `-webkit-transition:${transition}`,
                    `transition:${transition}`
                ].join(';'),
                opened: Math.abs(next) > 1
            });
        },

        swipeLeaveTransition() {
            const {leftWidth, rightWidth} = this.data;
            const offset = this.offset;
            let direction = '';
            let opened = false;

            if (rightWidth > 0 && -offset > rightWidth * THRESHOLD) {
                this.open('right');
                direction = 'right';
                opened = true;
            } else if (leftWidth > 0 && offset > leftWidth * THRESHOLD) {
                this.open('left');
                direction = 'left';
                opened = true;
            } else {
                direction = offset > 0 ? 'left' : offset < 0 ? 'right' : '';
                this.swipeMove(0);
                opened = false;
                this.triggerEvent('swipe_end', {
                    direction,
                    swiped: false,
                    name: this.properties.name,
                    extra: this.properties.extra
                });
            }

            this.setData({catchMove: false});
        },

        startDrag(e) {
            if (this.data.disabled) return;
            this.startOffset = this.offset || 0;
            this.direction = '';
            this.deltaX = 0;
            this.deltaY = 0;
            const touch = e.touches[0] || {};
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.dragging = false;

            this.triggerEvent('swipe_start', {
                direction: this.startOffset > 0 ? 'left' : this.startOffset < 0 ? 'right' : '',
                swiped: Math.abs(this.startOffset) > 1,
                name: this.properties.name,
                extra: this.properties.extra
            });
        },

        onDrag(e) {
            if (this.data.disabled) return;
            const touch = e.touches[0] || {};
            this.deltaX = touch.clientX - this.startX;
            this.deltaY = touch.clientY - this.startY;
            const offsetX = Math.abs(this.deltaX);
            const offsetY = Math.abs(this.deltaY);

            if (!this.direction) {
                if (offsetX > offsetY && offsetX > MIN_DISTANCE) {
                    this.direction = 'horizontal';
                } else if (offsetY > offsetX && offsetY > MIN_DISTANCE) {
                    this.direction = 'vertical';
                }
            }

            if (this.direction !== 'horizontal') return;

            this.dragging = true;
            INSTANCES.forEach((item) => {
                if (item !== this && item.offset) item.close();
            });

            if (!this.data.catchMove) {
                this.setData({catchMove: true});
            }

            this.swipeMove(this.startOffset + this.deltaX);
        },

        endDrag() {
            if (this.data.disabled) return;
            if (!this.dragging) {
                this.setData({catchMove: false});
                return;
            }
            this.dragging = false;
            this.swipeLeaveTransition();
        },

        noop() {},

        onContentTap(e) {
            const key = (e.currentTarget.dataset || {}).key || 'cell';
            if (!this.offset) {
                this.triggerEvent('content_tap', {
                    name: this.properties.name,
                    extra: this.properties.extra
                });
                return;
            }
            if (this.properties.autoClose) this.close();
            this.triggerEvent('content_tap', {
                position: key,
                name: this.properties.name,
                extra: this.properties.extra
            });
        },

        onButtonTap(e) {
            const {direction, index} = e.currentTarget.dataset;
            const buttons = direction === 'left' ? this.data._leftButtons : this.data._rightButtons;
            const button = buttons[index] || {};
            const detail = {
                direction,
                index: Number(index),
                text: button.text || '',
                type: button.type || 'default',
                button,
                name: this.properties.name,
                extra: this.properties.extra
            };
            this.triggerEvent('button_tap', detail);
            if (direction === 'left') {
                this.triggerEvent('left_button_tap', detail);
            } else {
                this.triggerEvent('right_button_tap', detail);
            }
            if (this.properties.autoClose) this.close();
        }
    }
});
