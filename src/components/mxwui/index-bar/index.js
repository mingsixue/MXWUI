import {COLOR} from '../utils/common';

Component({
    properties: {
        // 索引数组 [{label, disablePreview}]，不传则从 list 自动生成
        items: {
            type: Array,
            value: []
        },
        // 分组列表 [{index, children: [{name, desc, avatar}]}]
        list: {
            type: Array,
            value: []
        },
        // 受控当前索引
        current: {
            type: String,
            value: ''
        },
        // 默认索引
        defaultCurrent: {
            type: String,
            value: ''
        },
        // 索引项尺寸（宽高，单位 px）
        size: {
            type: Number,
            value: 16
        },
        // 组件高度，带单位
        height: {
            type: String,
            value: '100%'
        },
        // 激活态颜色
        activeColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 索引文字颜色
        textColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 预览气泡背景色
        tipBgColor: {
            type: String,
            value: '#CCCCCC'
        },
        // 预览气泡文字色
        tipColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        // 分组标题背景色
        headerBgColor: {
            type: String,
            value: COLOR.BG_COLOR
        },
        // 分组标题文字色
        headerColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        },
        // 是否吸顶分组标题
        sticky: {
            type: Boolean,
            value: true
        },
        // 是否显示头像
        showAvatar: {
            type: Boolean,
            value: true
        },
        // 头像尺寸（rpx）
        avatarSize: {
            type: Number,
            value: 72
        }
    },
    data: {
        indexList: [],
        currentKey: 0,
        touchKey: '',
        itemHeight: 16,
        moving: false,
        showMask: false,
        scrollIntoView: ''
    },
    observers: {
        'items, list, current, defaultCurrent': function(items, list, current, defaultCurrent) {
            this._initIndex(items, list, current, defaultCurrent);
        }
    },
    lifetimes: {
        ready() {
            this._initIndex(
                this.data.items,
                this.data.list,
                this.data.current,
                this.data.defaultCurrent
            );
            this._initItemHeight();
        }
    },
    methods: {
        _initIndex(items, list, current, defaultCurrent) {
            let indexList = [];
            if (items && items.length) {
                indexList = items.map((item) => {
                    if (typeof item === 'string') {
                        return {label: item};
                    }
                    return item;
                });
            } else if (list && list.length) {
                indexList = list.map((group) => ({
                    label: group.index
                }));
            }

            const initCurrent = current || defaultCurrent || (indexList[0] && indexList[0].label) || '';
            const currentKey = indexList.findIndex((u) => u.label === initCurrent);
            const nextKey = currentKey >= 0 ? currentKey : 0;

            this.setData({
                indexList,
                currentKey: nextKey,
                itemHeight: this.data.size || 16
            });

            // 受控 current 变化时同步滚动
            if (current && list && list.length) {
                this._scrollToIndex(nextKey);
            }
        },

        _initItemHeight() {
            const query = this.createSelectorQuery();
            query.select('.mx-index-bar-side-content').boundingClientRect();
            query.select('#mx-alphabet-0').boundingClientRect();
            query.exec((res) => {
                if (res && res[0]) {
                    this._sideTop = res[0].top;
                }
                if (res && res[1] && res[1].height) {
                    this.setData({itemHeight: res[1].height});
                }
            });
        },

        _getIndexByClientY(clientY) {
            const {indexList, itemHeight} = this.data;
            if (!indexList.length) return -1;

            const sideTop = this._sideTop || 0;
            let index = Math.floor((clientY - sideTop) / itemHeight);
            if (index < 0) index = 0;
            if (index > indexList.length - 1) index = indexList.length - 1;
            return index;
        },

        _selectIndex(index) {
            const {indexList, currentKey} = this.data;
            const item = indexList[index];
            if (!item) return;

            const tip = item.disablePreview ? '' : item.label;
            this.setData({
                currentKey: index,
                touchKey: tip
            });
            this._scrollToIndex(index);

            if (currentKey !== index) {
                this.triggerEvent('change', {item, index, label: item.label});
            }
        },

        _scrollToIndex(index) {
            const {indexList, list} = this.data;
            const label = indexList[index] && indexList[index].label;
            if (!label || !list || !list.length) return;

            this.setData({scrollIntoView: `mx-index-${label}`});
            clearTimeout(this._scrollResetTimer);
            this._scrollResetTimer = setTimeout(() => {
                this.setData({scrollIntoView: ''});
            }, 300);
        },

        onTouchStart(e) {
            const point = (e.touches && e.touches[0]) || {};
            // 每次开始时刷新侧边栏位置，避免布局变化导致偏移
            const query = this.createSelectorQuery();
            query.select('.mx-index-bar-side-content').boundingClientRect();
            query.exec((res) => {
                if (res && res[0]) {
                    this._sideTop = res[0].top;
                }
                const index = this._getIndexByClientY(point.clientY || 0);
                this.setData({
                    moving: true,
                    showMask: true
                });
                this._selectIndex(index);
            });
        },

        onTouchMove(e) {
            if (!this.data.moving) return;
            const point = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
            if (!point) return;
            const index = this._getIndexByClientY(point.clientY);
            this._selectIndex(index);
        },

        onTouchEnd() {
            if (!this.data.moving) return;
            this.setData({
                touchKey: '',
                showMask: false,
                moving: false
            });
        },

        onScroll() {
            if (this.data.moving) return;
            const {list} = this.data;
            if (!list || !list.length) return;
            this._syncCurrentByScroll();
        },

        _syncCurrentByScroll() {
            if (this._scrollLock) return;
            this._scrollLock = true;

            const query = this.createSelectorQuery();
            query.select('.mx-index-bar-scroll').boundingClientRect();
            this.data.indexList.forEach((item) => {
                query.select(`#mx-index-${item.label}`).boundingClientRect();
            });
            query.exec((rects) => {
                this._scrollLock = false;
                if (!rects || !rects.length) return;

                const container = rects[0];
                if (!container) return;

                let active = 0;
                for (let i = 1; i < rects.length; i++) {
                    const rect = rects[i];
                    if (rect && rect.top <= container.top + 8) {
                        active = i - 1;
                    }
                }

                if (active !== this.data.currentKey) {
                    this.setData({currentKey: active});
                }
            });
        },

        handleItemTap(e) {
            const {item, group, index, gidx} = e.currentTarget.dataset;
            this.triggerEvent('select', {
                item,
                group,
                index,
                groupIndex: gidx
            });
        }
    }
});
