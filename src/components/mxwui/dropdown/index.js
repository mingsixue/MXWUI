import {COLOR} from '../utils/common';
import {getDropdownStyle} from './utils';

Component({
    options: {
        multipleSlots: true,
    },
    properties: {
        // 菜单项
        options: {
            type: Array,
            value: [],
        },
        // 菜单弹出位置
        placement: {
            type: String,
            value: 'bottom-left',
        },
        // 是否显示（受控）
        visible: {
            type: null,
            value: null,
        },
        // 默认是否显示（非受控）
        defaultVisible: {
            type: Boolean,
            value: false,
        },
        // 是否展示透明蒙层（点击空白关闭）
        showMask: {
            type: Boolean,
            value: true,
        },
        // 选中后是否自动关闭
        closeOnSelect: {
            type: Boolean,
            value: true,
        },
        // 被遮挡时是否自动调整位置
        autoAdjustOverflow: {
            type: Boolean,
            value: true,
        },
        // 关闭时是否销毁内容
        destroyOnClose: {
            type: Boolean,
            value: false,
        },
        // 菜单最小宽度
        menuWidth: {
            type: null,
            value: '',
        },
        // 菜单自定义样式
        menuStyle: {
            type: String,
            value: '',
        },
        // 层级
        zIndex: {
            type: Number,
            value: 999,
        },
        TEXT_COLOR: {
            type: String,
            value: COLOR.TEXT_COLOR,
        },
        THEME_COLOR: {
            type: String,
            value: COLOR.THEME_COLOR,
        },
        PLACEHOLDER_COLOR: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR,
        },
    },
    data: {
        innerVisible: false,
        adjustedPlacement: '',
        dropdownMenuStyle: '',
        menuWidthStyle: '',
    },
    observers: {
        visible(val) {
            if (val === null || val === undefined) {
                return;
            }
            this._controlled = true;
            this._applyVisible(!!val, true);
        },
        placement() {
            if (this.data.innerVisible) {
                this.updateDropdown();
            }
        },
        autoAdjustOverflow() {
            if (this.data.innerVisible) {
                this.updateDropdown();
            }
        },
        menuWidth(val) {
            this.setData({
                menuWidthStyle: this._buildMenuWidthStyle(val),
            });
        },
        options() {
            if (this.data.innerVisible) {
                wx.nextTick(() => {
                    this.updateDropdown();
                });
            }
        },
    },
    lifetimes: {
        attached() {
            const {visible, defaultVisible, menuWidth} = this.properties;
            this.setData({
                menuWidthStyle: this._buildMenuWidthStyle(menuWidth),
            });
            if (visible !== null && visible !== undefined) {
                this._controlled = true;
                this._applyVisible(!!visible, true);
            } else if (defaultVisible) {
                this._applyVisible(true, true);
            }
        },
    },
    methods: {
        _buildMenuWidthStyle(menuWidth) {
            if (menuWidth === '' || menuWidth === null || menuWidth === undefined) {
                return '';
            }
            if (typeof menuWidth === 'number') {
                return `min-width:${menuWidth}rpx;`;
            }
            return `min-width:${menuWidth};`;
        },

        _applyVisible(nextVisible, silent, type) {
            if (nextVisible === this.data.innerVisible) {
                if (nextVisible) {
                    this.updateDropdown();
                }
                return;
            }

            if (nextVisible) {
                this.setData({
                    innerVisible: true,
                    adjustedPlacement: '',
                    dropdownMenuStyle: '',
                }, () => {
                    wx.nextTick(() => {
                        this.updateDropdown();
                    });
                });
            } else {
                this.setData({
                    innerVisible: false,
                    adjustedPlacement: '',
                    dropdownMenuStyle: '',
                });
            }

            if (!silent) {
                this.triggerEvent('dropdown_visible_change', {
                    visible: nextVisible,
                    type: type || 'trigger',
                });
            }
        },

        updateDropdown() {
            if (!this.data.innerVisible) {
                return;
            }

            const query = this.createSelectorQuery();
            query.select('#mx-dropdown-root').boundingClientRect();
            query.select('#mx-dropdown-children').boundingClientRect();
            query.select('#mx-dropdown-menu').boundingClientRect();
            query.exec((res) => {
                const containerRect = res && res[0];
                const childrenRect = res && res[1];
                const contentRect = res && res[2];
                if (!containerRect || !childrenRect || !contentRect || !contentRect.width) {
                    setTimeout(() => {
                        if (this.data.innerVisible) {
                            this.updateDropdown();
                        }
                    }, 30);
                    return;
                }

                const systemInfo = wx.getSystemInfoSync();
                const {placement, autoAdjustOverflow} = this.data;
                const result = getDropdownStyle(placement, autoAdjustOverflow, {
                    containerRect,
                    childrenRect,
                    contentRect,
                    systemInfo,
                });

                this.setData({
                    dropdownMenuStyle: result.menuStyle,
                    adjustedPlacement: result.adjustedPlacement,
                });
            });
        },

        handleTriggerTap() {
            const nextVisible = !this.data.innerVisible;
            if (this._controlled) {
                this.triggerEvent('dropdown_visible_change', {
                    visible: nextVisible,
                    type: 'trigger',
                });
                return;
            }
            this._applyVisible(nextVisible);
        },

        handleMaskTap() {
            if (!this.data.innerVisible) {
                return;
            }
            if (this._controlled) {
                this.triggerEvent('dropdown_visible_change', {
                    visible: false,
                    type: 'mask',
                });
                return;
            }
            this._applyVisible(false, false, 'mask');
        },

        handleItem(e) {
            const {item = {}, idx} = e.currentTarget.dataset;
            if (item.disabled) {
                return;
            }

            this.triggerEvent('dropdown_select', {
                item,
                index: idx,
            });

            if (!this.properties.closeOnSelect) {
                return;
            }

            if (this._controlled) {
                this.triggerEvent('dropdown_visible_change', {
                    visible: false,
                    type: 'select',
                });
                return;
            }
            this._applyVisible(false, false, 'select');
        },

        // 阻止冒泡到蒙层
        handleMenuTap() {},
    },
});
