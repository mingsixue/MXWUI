import {COLOR} from '../utils/common';
import selectBehavior from '../behaviors/select';

Component({
    behaviors: [selectBehavior],
    properties: {
        // 类型：single 单选 / multiple 多选
        type: {
            type: String,
            value: 'single'
        },
        // 单选框样式 default / radio
        singleIcon: {
            type: String,
            value: 'default'
        },
        // 复选框样式 default / checkbox
        multipleIcon: {
            type: String,
            value: 'default'
        },
        // 单选框 / 复选框 颜色
        iconColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 单选框 / 复选框 大小
        iconSize: {
            type: Number,
            value: 48
        },
        // 文本颜色
        textColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 文本选中颜色
        textSelectColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 描述或错误文案
        desc: {
            type: String,
            value: ''
        },
        // 描述或错误文案颜色
        descColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR
        },
        // 标签文案
        label: {
            type: String,
            value: ''
        },
        // 标签文案文本色
        labelColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 是否显示必填星号
        required: {
            type: Boolean,
            value: false
        },
        // 必填星号位置，left、right
        requiredPosition: {
            type: String,
            value: 'right'
        },
        // 标签前图标
        firstIcon: {
            type: Object,
            value: {}
        },
        // 标签后图标
        lastIcon: {
            type: Object,
            value: {}
        },
        // 背景色
        bgColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        // 单选默认不允许取消，可显式开启
        allowDeselect: {
            type: Boolean,
            value: false
        },
        PLACEHOLDER_COLOR: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        }
    },
    methods: {
        handleTap(e) {
            const {idx} = e.currentTarget.dataset;
            const result = this.toggleOption(idx);
            if (!result) {
                return;
            }

            if (this.data.type == 'single') {
                this.triggerEvent("list_select_change", {
                    type: 'single',
                    index: result.checked ? idx : '',
                    value: result.checked ? result.value : '',
                    item: result.checked ? result.item : {},
                    options: result.options,
                });
            } else {
                const idxs = [];
                const vals = [];
                const items = [];
                result.options.forEach((item, index) => {
                    if (item.checked) {
                        idxs.push(index);
                        vals.push(item.value);
                        items.push(item);
                    }
                });
                this.triggerEvent("list_select_change", {
                    type: 'multiple',
                    index: idxs,
                    value: vals,
                    item: items,
                    options: result.options,
                });
            }
        },
        handleFirstClick() {
            this.triggerEvent("list_select_firstIcon");
        },
        handleLastClick() {
            this.triggerEvent("list_select_lastIcon");
        }
    }
});
