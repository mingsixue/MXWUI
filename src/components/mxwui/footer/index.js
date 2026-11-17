Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 带分割线的顶部文案
        label: {
            type: String,
            value: ''
        },
        // 普通内容（如版权信息）
        content: {
            type: String,
            value: ''
        },
        // 链接列表：[{ key, text, disabled }]
        links: {
            type: Array,
            value: []
        },
        // 底部标签：[{ key, text, disabled }]
        chips: {
            type: Array,
            value: []
        },
        // 无 label 分割线
        noLabelDivider: {
            type: Boolean,
            value: false
        },
        // 根节点自定义样式
        customStyle: {
            type: String,
            value: ''
        }
    },
    methods: {
        handleLinkTap(e) {
            const {item, index} = e.currentTarget.dataset;
            if (!item || item.disabled) return;
            this.triggerEvent('footer_link_tap', {
                item,
                index
            });
        },

        handleChipTap(e) {
            const {item, index} = e.currentTarget.dataset;
            if (!item || item.disabled) return;
            this.triggerEvent('footer_chip_tap', {
                item,
                index
            });
        }
    }
});
