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
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        showSkeleton: true,
        rootClass: '',
        rootStyle: ''
    },
    observers: {
        'loading, animate, customStyle': function () {
            this._sync();
        }
    },
    attached() {
        this._sync();
    },
    methods: {
        _sync() {
            const {loading, animate, customStyle} = this.data;
            const showSkeleton = loading !== false;
            const rootClass = [
                'mx-skeleton-title',
                animate ? 'mx-skeleton-animate' : ''
            ].filter(Boolean).join(' ');

            this.setData({
                showSkeleton,
                rootClass,
                rootStyle: customStyle || ''
            });
        }
    }
});
