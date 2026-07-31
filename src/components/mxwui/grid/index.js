import {COLOR} from '../utils/common';

function isImageUrl(src) {
    if (!src || typeof src !== 'string') return false;
    return /^(https?:)?\/\//.test(src)
        || /^data:image\//.test(src)
        || /\.(png|jpe?g|gif|svg|webp|bmp)(\?|$)/i.test(src);
}

function checkNeedVerticalSpace(count, index, columns) {
    if (count % columns === 0) {
        return index < count - columns;
    }
    return index < columns * Math.floor(count / columns);
}

function checkShowSplitLine(index, count, columns, mode, showDivider) {
    if (!showDivider) return false;
    if (index === count - 1) return false;
    if (mode === 'default' && (index + 1) % columns === 0) return false;
    return true;
}

Component({
    properties: {
        // 宫格数据
        items: {
            type: Array,
            value: []
        },
        // 每行列数，default 模式生效
        columns: {
            type: Number,
            value: 5
        },
        // 布局模式：default 平铺 / scroll 横向滑动
        mode: {
            type: String,
            value: 'default'
        },
        // item 布局：vertical 垂直 / horizontal 水平
        gridItemLayout: {
            type: String,
            value: 'vertical'
        },
        // 图标尺寸，单位 rpx
        iconSize: {
            type: Number,
            value: 56
        },
        // 图标样式：normal / circle
        iconStyle: {
            type: String,
            value: 'normal'
        },
        // 是否展示分割线
        showDivider: {
            type: Boolean,
            value: false
        },
        // 滑动模式分页条背景色
        paginationFillColor: {
            type: String,
            value: '#F5F5F5'
        },
        // 滑动模式分页条前景色
        paginationFrontColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
    },
    data: {
        renderItems: [],
        pageDeg: 0,
        COLOR,
    },
    observers: {
        'items, columns, mode, showDivider, iconStyle': function (items, columns, mode, showDivider, iconStyle) {
            this._buildRenderItems(items, columns, mode, showDivider, iconStyle);
        }
    },
    attached() {
        const {items, columns, mode, showDivider, iconStyle} = this.data;
        this._buildRenderItems(items, columns, mode, showDivider, iconStyle);
    },
    methods: {
        _buildRenderItems(items, columns, mode, showDivider, iconStyle) {
            const list = Array.isArray(items) ? items : [];
            const cols = Number(columns) > 0 ? Number(columns) : 5;
            const layoutMode = mode === 'scroll' ? 'scroll' : 'default';
            const count = list.length;

            const itemWidth = layoutMode === 'default' ? `${100 / cols}%` : '';
            const renderItems = list.map((item, index) => {
                const raw = item || {};
                const iconSrc = raw.iconUrl || raw.icon || '';
                const iconName = raw.iconName || (!isImageUrl(iconSrc) && !raw.iconUrl ? (raw.icon || '') : '');
                const isImage = !!raw.iconUrl || isImageUrl(iconSrc);

                return {
                    ...raw,
                    _index: index,
                    _isImage: isImage,
                    _iconSrc: isImage ? iconSrc : '',
                    _iconName: isImage ? '' : (iconName || ''),
                    _iconStyle: raw.iconStyle || iconStyle || 'normal',
                    _showLine: checkShowSplitLine(index, count, cols, layoutMode, !!showDivider),
                    _verticalSpace: layoutMode === 'default' && checkNeedVerticalSpace(count, index, cols),
                    _widthStyle: itemWidth ? `width:${itemWidth};` : '',
                };
            });

            this.setData({renderItems});
        },

        handleTap(e) {
            const {index} = e.currentTarget.dataset;
            const item = (this.data.items || [])[index];
            this.triggerEvent('grid_tap', {
                item,
                index,
            });
        },

        handleScroll(e) {
            const {scrollLeft, scrollWidth} = e.detail || {};
            if (!scrollWidth) return;

            this.createSelectorQuery()
                .in(this)
                .select('.mx-grid-scroll-content')
                .boundingClientRect((rect) => {
                    if (!rect || !rect.width) return;
                    const maxScroll = scrollWidth - rect.width;
                    const pageDeg = maxScroll > 0
                        ? Math.min(100, Math.ceil((scrollLeft / maxScroll) * 100))
                        : 0;
                    if (pageDeg !== this.data.pageDeg) {
                        this.setData({pageDeg});
                    }
                })
                .exec();
        },
    }
});
