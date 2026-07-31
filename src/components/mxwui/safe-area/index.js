Component({
    properties: {
        // 安全区位置：top / bottom / both
        position: {
            type: String,
            value: 'bottom'
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        },
    },
    data: {
        showTop: false,
        showBottom: true,
    },
    observers: {
        position(position) {
            this._syncPosition(position);
        }
    },
    attached() {
        this._syncPosition(this.data.position);
    },
    methods: {
        _syncPosition(position) {
            const pos = position === 'top' || position === 'bottom' || position === 'both'
                ? position
                : 'bottom';
            this.setData({
                showTop: pos === 'top' || pos === 'both',
                showBottom: pos === 'bottom' || pos === 'both',
            });
        },
    }
});
