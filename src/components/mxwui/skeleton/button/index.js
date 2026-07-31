const SIZE_LIST = ['small', 'medium', 'large'];

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
        // 按钮尺寸：small / medium / large
        size: {
            type: String,
            value: 'medium'
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
        'loading, animate, size, customStyle': function () {
            this._sync();
        }
    },
    attached() {
        this._sync();
    },
    methods: {
        _resolveSize(size) {
            if (SIZE_LIST.indexOf(size) >= 0) return size;
            return 'medium';
        },

        _sync() {
            const {loading, animate, size, customStyle} = this.data;
            const showSkeleton = loading !== false;
            const resolvedSize = this._resolveSize(size);
            const rootClass = [
                'mx-skeleton-button',
                `mx-skeleton-button-${resolvedSize}`,
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
