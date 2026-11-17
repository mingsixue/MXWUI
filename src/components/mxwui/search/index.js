import {COLOR} from '../utils/common';

Component({
    properties: {
        // 搜索栏样式 normal、insert
        styleType: {
            type: String,
            value: 'normal',
            observer(newVal) {
                let bgColor = COLOR.SOFT_BG_COLOR;
                let btnColor = COLOR.TEXT_COLOR;
                let keywordBgColor = COLOR.WHITE_COLOR;

                if (newVal == 'insert') {
                    bgColor = COLOR.WHITE_COLOR;
                    btnColor = COLOR.THEME_COLOR;
                    keywordBgColor = COLOR.SOFT_BG_COLOR;

                    if (this.data.btnColor !== COLOR.TEXT_COLOR) {
                        btnColor = this.data.btnColor;
                    }
                    if (this.data.bgColor !== COLOR.SOFT_BG_COLOR) {
                        bgColor = this.data.bgColor;
                    }
                }

                if (this.data.keywordBgColor) {
                    keywordBgColor = this.data.keywordBgColor;
                }

                this.setData({
                    bgColor,
                    btnColor,
                    keywordBgColor
                });
            }
        },
        // 值
        value: {
            type: String,
            value: ''
        },
        // 是否显示搜索图标
        showSearchIcon: {
            type: Boolean,
            value: true
        },
        // 搜索图标颜色
        searchIconColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 搜索图标大小
        searchIconSize: {
            type: Number,
            value: 48
        },
        // 占位文本
        placeholder: {
            type: String,
            value: '请输入'
        },
        // 占位文本颜色
        placeholderColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 光标颜色
        cursorColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 是否显示清除按钮
        showClear: {
            type: Boolean,
            value: true,
        },
        // 是否显示按钮
        showBtn: {
            type: Boolean,
            value: false
        },
        // 按钮文案
        btnText: {
            type: String,
            value: '搜索'
        },
        // 按钮文本色
        btnColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 搜索栏背景色
        bgColor: {
            type: String,
            value: COLOR.SOFT_BG_COLOR
        },
        // 预设关键词文本
        keyword: {
            type: String,
            value: ''
        },
        // 预设关键词 背景色
        keywordBgColor: {
            type: String,
            value: ''
        },
        // 预设关键词 文本色
        keywordColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 是否显示返回按钮
        showBack: {
            type: Boolean,
            value: false
        },
        // 返回图标颜色
        backColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        PLACEHOLDER_COLOR: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        WHITE_COLOR: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        keywordVisible: {
            type: Boolean,
            value: true
        },
        // 输入防抖毫秒，0 表示不防抖
        debounce: {
            type: Number,
            value: 0
        }
    },
    lifetimes: {
        detached() {
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = null;
            }
        },
    },
    methods: {
        handleCloseKeyword() {
            this.setData({
                keywordVisible: false,
            });
        },
        handleClear() {
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = null;
            }
            this.setData({
                value: ''
            });
            this.triggerEvent("search_change", {value: '', from: 'clear'});
        },
        handleBtn() {
            this.triggerEvent("search_change", {value: this.data.value, keyword: this.data.keyword, from: 'btn'});
        },
        handleInput(e) {
            const value = e.detail.value;
            this.setData({ value });

            const debounce = Number(this.data.debounce) || 0;
            if (debounce <= 0) {
                this.triggerEvent("search_change", {...e.detail, from: 'input'});
                return;
            }

            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
            }
            this._debounceTimer = setTimeout(() => {
                this._debounceTimer = null;
                this.triggerEvent("search_change", {value, from: 'input'});
            }, debounce);
        },
        handleBack() {
            this.triggerEvent("search_back");
        }
    }
});
