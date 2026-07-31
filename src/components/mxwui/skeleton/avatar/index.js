const SHAPE_LIST = ['circle', 'square'];
const SIZE_LIST = ['x-small', 'small', 'medium', 'large'];

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
        // 头像形状：circle / square
        shape: {
            type: String,
            value: 'square'
        },
        // 头像尺寸：x-small / small / medium / large，或带单位的自定义尺寸如 88rpx
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
        'loading, animate, shape, size, customStyle': function () {
            this._sync();
        }
    },
    attached() {
        this._sync();
    },
    methods: {
        _resolveShape(shape) {
            if (SHAPE_LIST.indexOf(shape) >= 0) return shape;
            return 'square';
        },

        _resolveSize(size) {
            if (SIZE_LIST.indexOf(size) >= 0) {
                return {preset: size, style: ''};
            }
            if (typeof size === 'string' && size.trim()) {
                const val = size.trim();
                return {
                    preset: '',
                    style: `width:${val};height:${val};`
                };
            }
            return {preset: 'medium', style: ''};
        },

        _sync() {
            const {loading, animate, shape, size, customStyle} = this.data;
            const showSkeleton = loading !== false;
            const resolvedShape = this._resolveShape(shape);
            const sizeInfo = this._resolveSize(size);
            const sizeClass = sizeInfo.preset
                ? `mx-skeleton-avatar-${sizeInfo.preset}`
                : '';
            const rootClass = [
                'mx-skeleton-avatar',
                `mx-skeleton-avatar-${resolvedShape}`,
                sizeClass,
                animate ? 'mx-skeleton-animate' : ''
            ].filter(Boolean).join(' ');

            this.setData({
                showSkeleton,
                rootClass,
                rootStyle: `${sizeInfo.style}${customStyle || ''}`
            });
        }
    }
});
