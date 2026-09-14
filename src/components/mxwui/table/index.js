import {COLOR} from '../utils/common';

const DEFAULT_WIDTH = 150;

const SORT_NEXT = {
    normal: 'forward',
    forward: 'reverse',
    reverse: 'normal',
};

function rpx2px(rpx, windowWidth = 375) {
    const num = Number(rpx);
    if (Number.isNaN(num)) return 0;
    return (num / 750) * windowWidth;
}

/**
 * 解析列宽
 * 支持：数字(rpx)、'120rpx'、'100px'、'20%'
 */
function resolveColumnWidth(width, windowWidth, fallback = DEFAULT_WIDTH) {
    if (width === undefined || width === null || width === '') {
        const widthPx = rpx2px(fallback, windowWidth);
        return {
            widthPx,
            widthStyle: `width:${widthPx}px;min-width:${widthPx}px;max-width:${widthPx}px;`,
            isPercent: false,
        };
    }

    if (typeof width === 'string') {
        const value = width.trim();
        if (/%$/.test(value)) {
            return {
                widthPx: 0,
                widthStyle: `width:${value};min-width:${value};flex-shrink:0;`,
                isPercent: true,
            };
        }
        if (/px$/i.test(value) && !/rpx$/i.test(value)) {
            const widthPx = parseFloat(value);
            return {
                widthPx,
                widthStyle: `width:${widthPx}px;min-width:${widthPx}px;max-width:${widthPx}px;`,
                isPercent: false,
            };
        }
        if (/rpx$/i.test(value)) {
            const widthPx = rpx2px(parseFloat(value), windowWidth);
            return {
                widthPx,
                widthStyle: `width:${widthPx}px;min-width:${widthPx}px;max-width:${widthPx}px;`,
                isPercent: false,
            };
        }
        const num = parseFloat(value);
        if (!Number.isNaN(num)) {
            const widthPx = rpx2px(num, windowWidth);
            return {
                widthPx,
                widthStyle: `width:${widthPx}px;min-width:${widthPx}px;max-width:${widthPx}px;`,
                isPercent: false,
            };
        }
    }

    const widthPx = rpx2px(Number(width) || fallback, windowWidth);
    return {
        widthPx,
        widthStyle: `width:${widthPx}px;min-width:${widthPx}px;max-width:${widthPx}px;`,
        isPercent: false,
    };
}

function getCellValue(row, dataIndex) {
    if (!row || dataIndex === undefined || dataIndex === null || dataIndex === '') {
        return '';
    }
    if (Array.isArray(dataIndex)) {
        return dataIndex.reduce((acc, key) => {
            if (acc === undefined || acc === null) return '';
            return acc[key];
        }, row);
    }
    if (typeof dataIndex === 'string' && dataIndex.indexOf('.') > -1) {
        return dataIndex.split('.').reduce((acc, key) => {
            if (acc === undefined || acc === null) return '';
            return acc[key];
        }, row);
    }
    const val = row[dataIndex];
    return val === undefined || val === null ? '' : val;
}

/** 解析对齐：align 优先，兼容 textAlignRight */
function resolveAlign(col, row) {
    const raw = (row && row.align) || (col && col.align) || '';
    const align = String(raw).toLowerCase();
    if (align === 'center' || align === 'right' || align === 'left') {
        return align;
    }
    if ((row && row.textAlignRight) || (col && col.textAlignRight)) {
        return 'right';
    }
    return 'left';
}

Component({
    options: {
        multipleSlots: true,
    },
    properties: {
        // 数据源
        dataSource: {
            type: Array,
            value: [],
        },
        // 列配置
        columns: {
            type: Array,
            value: [],
        },
        // 布局类型：DEFAULT 按列宽展示 / FULL 均分铺满
        displayType: {
            type: String,
            value: 'DEFAULT',
        },
        // 可滚动区域高度，如 300rpx / 200px
        scrollHeight: {
            type: String,
            value: '',
        },
        // 空数据文案，设为空字符串可仅使用插槽
        emptyText: {
            type: String,
            value: '暂无数据',
        },
        // 空状态图标名，空字符串不展示图标
        emptyIcon: {
            type: String,
            value: 'empty',
        },
        // 空状态自定义图片
        emptyIconUrl: {
            type: String,
            value: '',
        },
        // 空状态图标尺寸，单位 rpx
        emptyIconSize: {
            type: Number,
            value: 120,
        },
        // 空状态图标颜色（iconfont 生效）
        emptyIconColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR,
        },
        // 自定义根节点样式
        customStyle: {
            type: String,
            value: '',
        },
        // 是否开启斑马纹
        stripe: {
            type: Boolean,
            value: false,
        },
        // 斑马纹显示方式：ROW 隔行 / COLUMN 隔列
        stripeType: {
            type: String,
            value: 'ROW',
        },
        // 斑马纹颜色
        stripeColor: {
            type: String,
            value: COLOR.BG_COLOR,
        },
        // 表头背景色
        headerBgColor: {
            type: String,
            value: COLOR.WHITE_COLOR,
        },
    },
    data: {
        widthPx: 0,
        innerWidthStyle: '',
        headerRow: null,
        bodyRows: [],
        isEmpty: true,
        isFull: false,
        showFixedShadow: false,
        hasFixed: false,
        scrollStyle: '',
        emptyInnerStyle: '',
    },
    observers: {
        'dataSource, columns, displayType, scrollHeight, stripe, stripeType, stripeColor, headerBgColor': function () {
            this._init();
        },
    },
    lifetimes: {
        attached() {
            this._sorterKey = '';
            this._sorterStatus = 'normal';
            this._windowWidth = 375;
            try {
                const info = wx.getSystemInfoSync();
                this._windowWidth = info.windowWidth || 375;
            } catch (e) {
                // ignore
            }
            this._init();
        },
    },
    methods: {
        _init() {
            const columns = Array.isArray(this.data.columns) ? this.data.columns : [];
            const dataSource = Array.isArray(this.data.dataSource) ? this.data.dataSource : [];
            const isFull = String(this.data.displayType || '').toUpperCase() === 'FULL';
            const windowWidth = this._windowWidth || 375;

            let totalWidthPx = 0;
            let hasPercentWidth = false;
            columns.forEach((col) => {
                const resolved = resolveColumnWidth(col && col.width, windowWidth);
                if (resolved.isPercent) {
                    hasPercentWidth = true;
                } else {
                    totalWidthPx += resolved.widthPx;
                }
            });

            const headerRow = this._buildHeader(columns, windowWidth, isFull);
            let bodyRows = this._buildRows(dataSource, columns, windowWidth, isFull);

            if (this._sorterKey && this._sorterStatus !== 'normal') {
                bodyRows = this._sortRows(bodyRows, this._sorterKey, this._sorterStatus);
            }

            const scrollHeight = this.data.scrollHeight || '';
            const hasFixed = columns.some((col) => !!(col && col.fixed));
            const emptyInnerStyle = isFull
                ? ''
                : `width:${windowWidth}px;`;

            let innerWidthStyle = '';
            if (!isFull) {
                innerWidthStyle = hasPercentWidth
                    ? 'width:100%;'
                    : (totalWidthPx ? `width:${totalWidthPx}px;` : '');
            }

            this.setData({
                widthPx: isFull || hasPercentWidth ? 0 : totalWidthPx,
                innerWidthStyle,
                headerRow,
                bodyRows,
                isEmpty: dataSource.length === 0,
                isFull,
                hasFixed,
                scrollStyle: scrollHeight ? `height:${scrollHeight};` : '',
                emptyInnerStyle,
            });
        },

        _buildHeader(columns, windowWidth, isFull) {
            const headerBgColor = this.data.headerBgColor || COLOR.WHITE_COLOR;
            const headerBgStyle = `background:${headerBgColor};`;
            return {
                type: 'columns',
                cells: columns.map((col) => {
                    const key = col.key || col.dataIndex || '';
                    const resolved = resolveColumnWidth(col.width, windowWidth);
                    const align = resolveAlign(col);
                    return {
                        ...col,
                        key,
                        widthPx: resolved.widthPx,
                        widthStyle: isFull ? '' : resolved.widthStyle,
                        headerBgStyle,
                        align,
                        alignClass: align === 'left' ? '' : `mx-table-cell-${align}`,
                        sorterStatus: key === this._sorterKey ? this._sorterStatus : 'normal',
                        fixed: !!col.fixed,
                        sorter: !!col.sorter,
                    };
                }),
            };
        },

        _buildRows(dataSource, columns, windowWidth, isFull) {
            const stripe = !!this.data.stripe;
            const stripeType = String(this.data.stripeType || 'ROW').toUpperCase();
            const stripeColor = this.data.stripeColor || COLOR.BG_COLOR;
            const isColumnStripe = stripeType === 'COLUMN';

            return dataSource.map((row, rowIndex) => ({
                type: 'rows',
                key: row && (row.key !== undefined ? row.key : rowIndex),
                index: rowIndex,
                row,
                cells: columns.map((col, colIndex) => {
                    const key = col.key || col.dataIndex || '';
                    const resolved = resolveColumnWidth(col.width, windowWidth);
                    const value = getCellValue(row, col.dataIndex);
                    const align = resolveAlign(col, row);
                    const isStripeCell = stripe && (
                        isColumnStripe
                            ? colIndex % 2 === 1
                            : rowIndex % 2 === 1
                    );
                    return {
                        key,
                        index: colIndex,
                        dataIndex: col.dataIndex,
                        value,
                        widthPx: resolved.widthPx,
                        widthStyle: isFull ? '' : resolved.widthStyle,
                        stripeStyle: isStripeCell ? `background:${stripeColor};` : '',
                        align,
                        alignClass: align === 'left' ? '' : `mx-table-cell-${align}`,
                        fixed: !!col.fixed,
                        ellipsisRow: col.ellipsisRow || 0,
                        ellipsisStyle: col.ellipsisRow
                            ? `-webkit-line-clamp:${Number(col.ellipsisRow)};`
                            : '',
                    };
                }),
            }));
        },

        _sortRows(rows, key, status) {
            const list = rows.slice();
            list.sort((a, b) => {
                const aCell = (a.cells || []).find((c) => c.key === key);
                const bCell = (b.cells || []).find((c) => c.key === key);
                const aValue = aCell ? aCell.value : '';
                const bValue = bCell ? bCell.value : '';
                const aNum = Number(aValue);
                const bNum = Number(bValue);
                const comparable = !Number.isNaN(aNum) && !Number.isNaN(bNum)
                    && aValue !== '' && bValue !== '';

                let result = 0;
                if (comparable) {
                    result = aNum - bNum;
                } else {
                    result = String(aValue).localeCompare(String(bValue), 'zh-CN');
                }
                return status === 'forward' ? result : -result;
            });
            return list.map((item, index) => ({
                ...item,
                index,
            }));
        },

        handleSort(e) {
            const {index} = e.currentTarget.dataset || {};
            const cells = (this.data.headerRow && this.data.headerRow.cells) || [];
            const item = cells[index];
            if (!item || !item.sorter) return;

            const nextStatus = SORT_NEXT[item.sorterStatus] || 'forward';
            this._sorterKey = nextStatus === 'normal' ? '' : item.key;
            this._sorterStatus = nextStatus;
            this._init();

            this.triggerEvent('table_sort', {
                key: item.key,
                dataIndex: item.dataIndex,
                sorterStatus: nextStatus,
            });
        },

        handleScroll(e) {
            if (!this.data.hasFixed) return;
            const scrollLeft = (e.detail && e.detail.scrollLeft) || 0;
            const showFixedShadow = scrollLeft > 2;
            if (showFixedShadow !== this.data.showFixedShadow) {
                this.setData({showFixedShadow});
            }
        },

        handleRowTap(e) {
            const {index} = e.currentTarget.dataset || {};
            const row = (this.data.bodyRows || [])[index];
            if (!row) return;
            this.triggerEvent('table_row_tap', {
                row: row.row,
                index: row.index,
            });
        },

        handleCellTap(e) {
            const {rowIndex, colIndex} = e.currentTarget.dataset || {};
            const row = (this.data.bodyRows || [])[rowIndex];
            if (!row) return;
            const cell = (row.cells || [])[colIndex];
            this.triggerEvent('table_cell_tap', {
                row: row.row,
                rowIndex: row.index,
                cell,
                colIndex,
                value: cell ? cell.value : '',
            });
        },
    },
});
