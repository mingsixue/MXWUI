const SHAPE_LIST = ['circle', 'square'];
const SIZE_LIST = ['x-small', 'small', 'medium', 'large'];

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 为 true 时显示占位图，反之展示子节点
        loading: {
            type: Boolean,
            value: true
        },
        // 是否展示动画效果
        animate: {
            type: Boolean,
            value: false
        },
        // 是否显示头像占位
        avatar: {
            type: Boolean,
            value: false
        },
        // 是否显示标题占位
        title: {
            type: Boolean,
            value: true
        },
        // 段落行数，大于 0 展示
        rows: {
            type: null,
            value: 3
        },
        // 头像大小：x-small / small / medium / large，或自定义如 88rpx
        avatarSize: {
            type: String,
            value: 'medium'
        },
        // 头像形状：circle / square
        avatarShape: {
            type: String,
            value: 'square'
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        showSkeleton: true,
        showAvatar: false,
        showTitle: true,
        showParagraph: true,
        paragraphRows: 3,
        resolvedAvatarSize: 'medium',
        resolvedAvatarShape: 'square',
        rootStyle: ''
    },
    observers: {
        'loading, animate, avatar, title, rows, avatarSize, avatarShape, customStyle': function () {
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
            if (SIZE_LIST.indexOf(size) >= 0) return size;
            if (typeof size === 'string' && size.trim()) return size.trim();
            return 'medium';
        },

        _resolveRows(rows) {
            const num = Number(rows);
            if (Number.isNaN(num) || num <= 0) return 0;
            return Math.min(Math.floor(num), 20);
        },

        _sync() {
            const {
                loading,
                avatar,
                title,
                rows,
                avatarSize,
                avatarShape,
                customStyle
            } = this.data;

            const paragraphRows = this._resolveRows(rows);

            this.setData({
                showSkeleton: loading !== false,
                showAvatar: !!avatar,
                showTitle: title !== false,
                showParagraph: paragraphRows > 0,
                paragraphRows,
                resolvedAvatarSize: this._resolveSize(avatarSize),
                resolvedAvatarShape: this._resolveShape(avatarShape),
                rootStyle: customStyle || ''
            });
        }
    }
});
