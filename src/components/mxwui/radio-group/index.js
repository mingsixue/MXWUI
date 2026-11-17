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
        // 单选框位置，after / before
        radioPosition: {
            type: String,
            value: 'before'
        },
        // 单选框未选中颜色
        radioColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 单选框选中颜色
        radioSelectColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 单选框大小
        radioSize: {
            type: Number,
            value: 48
        },
        // 标签文案颜色（覆盖 form-field 默认空值）
        labelColor: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        // 是否横向布局，styleType=web时有效
        horizontal: {
            type: Boolean,
            value: false
        },
        // 背景色
        bgColor: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        // 单选默认不允许取消
        allowDeselect: {
            type: Boolean,
            value: false
        },
        WHITE_COLOR: {
            type: String,
            value: COLOR.WHITE_COLOR
        }
    },
    methods: {
        handleRadio(e) {
            const {idx} = e.currentTarget.dataset;
            const result = this.toggleOption(idx);
            if (!result) {
                return;
            }
            this.triggerEvent("radio_group_change", result);
        },
        handleFirstClick() {
            this.triggerEvent("radio_group_firstIcon");
        },
        handleLastClick() {
            this.triggerEvent("radio_group_lastIcon");
        }
    }
});
