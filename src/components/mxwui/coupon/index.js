import {COLOR} from '../utils/common';

function pad(n) {
    return n < 10 ? `0${n}` : `${n}`;
}

function formatDateTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return [
        `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`,
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    ].join(' ');
}

function normalizeValidTime(value) {
    if (value == null || value === '') return '';

    if (typeof value === 'number') {
        const ms = value < 1e12 ? value * 1000 : value;
        return formatDateTime(new Date(ms));
    }

    const text = String(value).trim();
    if (!text) return '';

    if (/^\d+$/.test(text)) {
        const num = Number(text);
        const ms = text.length <= 10 ? num * 1000 : num;
        return formatDateTime(new Date(ms));
    }

    const normalized = text.replace(/-/g, '/');

    // 已是完整到秒
    if (/^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/.test(normalized)) {
        const parsed = new Date(normalized);
        return formatDateTime(parsed) || normalized;
    }

    // 仅日期：补齐 23:59:59
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) {
        const parsed = new Date(`${normalized} 23:59:59`);
        return formatDateTime(parsed) || `${normalized} 23:59:59`;
    }

    // 到分：补齐秒
    if (/^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{1,2}$/.test(normalized)) {
        const parsed = new Date(`${normalized}:00`);
        return formatDateTime(parsed) || `${normalized}:00`;
    }

    const parsed = new Date(normalized);
    return formatDateTime(parsed) || normalized;
}

Component({
    options: {
        multipleSlots: true,
        virtualHost: true,
    },
    properties: {
        // 券尺寸：large | small
        size: {
            type: String,
            value: 'large',
        },
        // 排列方式：horizontal | vertical | multipleColumn
        direction: {
            type: String,
            value: 'horizontal',
        },
        // 数据源
        dataSource: {
            type: Array,
            value: [],
        },
        // 主题色
        themeColor: {
            type: String,
            value: COLOR.THEME_COLOR,
        },
        // 有效期前缀
        validTimePrefix: {
            type: String,
            value: '有效期至',
        },
        // 自定义样式
        customStyle: {
            type: String,
            value: '',
        },
    },
    data: {
        list: [],
        isMultiple: false,
        isSmall: false,
    },
    observers: {
        'dataSource, size, direction, validTimePrefix': function () {
            this._syncList();
        },
    },
    attached() {
        this._syncList();
    },
    methods: {
        _syncList() {
            const {dataSource, size, validTimePrefix} = this.data;
            const source = Array.isArray(dataSource) ? dataSource : [];
            const prefix = validTimePrefix == null ? '有效期至' : String(validTimePrefix);
            const list = source.map((item) => {
                const money = item.money == null ? '' : String(item.money);
                const moneyUnit = item.moneyUnit || '元';
                const validTime = normalizeValidTime(
                    item.validTime != null ? item.validTime : item.expireTime
                );
                let validTimeText = '';
                if (item.validTimeText) {
                    validTimeText = String(item.validTimeText);
                } else if (validTime) {
                    validTimeText = prefix ? `${prefix} ${validTime}` : validTime;
                }
                return {
                    ...item,
                    money,
                    moneyUnit,
                    moneySmall: money.length > 3,
                    threshold: item.threshold || '',
                    title: item.title || '',
                    desc: item.desc || '',
                    validTime,
                    validTimeText,
                    disabled: !!item.disabled,
                    actionAreaInfo: item.actionAreaInfo || null,
                };
            });
            this.setData({
                list,
                isMultiple: list.length > 1,
                isSmall: size === 'small',
            });
        },

        handleCouponTap(e) {
            const {index} = e.currentTarget.dataset;
            const item = this.data.list[index];
            if (!item || item.disabled) return;
            this.triggerEvent('coupon_tap', {item, index});
        },

        handleBtnTap(e) {
            const {index} = e.currentTarget.dataset;
            const item = this.data.list[index];
            if (!item || item.disabled) return;
            const action = item.actionAreaInfo || {};
            if (action.disabled) return;
            this.triggerEvent('coupon_btn_tap', {item, index});
        },
    },
});
