import {COLOR} from '../utils/common';
import formFieldBehavior from '../behaviors/form-field';
import selectBehavior from '../behaviors/select';

Component({
    behaviors: [formFieldBehavior, selectBehavior],
    properties: {
        // 样式类型，normal、horizontal、vertical、web
        styleType: {
            type: String,
            value: 'normal'
        },
        // 复选框位置，after / before
        checkboxPosition: {
            type: String,
            value: 'before'
        },
        // 复选框未选中颜色
        checkboxColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 复选框选中颜色
        checkboxSelectColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 复选框大小
        checkboxSize: {
            type: Number,
            value: 48
        },
        // 标签文案颜色
        labelColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 背景色
        bgColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        // 是否横向布局，styleType=web时有效
        horizontal: {
            type: Boolean,
            value: false
        },
        // 复选为多选
        mode: {
            type: String,
            value: 'multiple'
        },
        WHITE_COLOR: {
            type: String,
            value: COLOR.WHITE_COLOR
        }
    },
    methods: {
        handleCheckbox(e) {
            const {idx} = e.currentTarget.dataset;
            const result = this.toggleOption(idx);
            if (!result) {
                return;
            }

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

            this.triggerEvent("checkbox_group_change", {
                index: idxs,
                value: vals,
                item: items,
                options: result.options,
            });
        },
        // 兼容旧方法名
        handleRadio(e) {
            this.handleCheckbox(e);
        },
        handleFirstClick() {
            this.triggerEvent("checkbox_group_firstIcon");
        },
        handleLastClick() {
            this.triggerEvent("checkbox_group_lastIcon");
        }
    }
});
