Component({
    options: {
        virtualHost: true
    },
    properties: {
        // 为 true 时显示占位，反之展示子节点
        loading: {
            type: Boolean,
            value: true
        },
        // 是否展示动画
        animate: {
            type: Boolean,
            value: false
        },
        // 段落行数，大于 0 展示
        rows: {
            type: null,
            value: 3
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        showSkeleton: true,
        rowList: [],
        animateOn: false,
        rootClass: '',
        rootStyle: ''
    },
    observers: {
        'loading, animate, rows, customStyle': function () {
            this._sync();
        }
    },
    attached() {
        this._sync();
    },
    methods: {
        _resolveRows(rows) {
            const num = Number(rows);
            if (Number.isNaN(num) || num <= 0) return 0;
            return Math.min(Math.floor(num), 20);
        },

        _sync() {
            const {loading, animate, rows, customStyle} = this.data;
            const showSkeleton = loading !== false;
            const count = this._resolveRows(rows);
            const rowList = [];
            for (let i = 0; i < count; i++) {
                rowList.push({
                    index: i,
                    last: i === count - 1 && count > 1
                });
            }

            this.setData({
                showSkeleton,
                rowList,
                animateOn: !!animate,
                rootClass: 'mx-skeleton-paragraph',
                rootStyle: customStyle || ''
            });
        }
    }
});
