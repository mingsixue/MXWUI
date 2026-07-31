import { COLOR } from '../utils/common';

/**
 * 表单字段通用：label / required / desc / icons
 */
export default Behavior({
    properties: {
        label: {
            type: String,
            value: '',
        },
        labelColor: {
            type: String,
            value: '',
        },
        labelAlign: {
            type: String,
            value: 'left',
        },
        leftWidth: {
            type: null,
            value: null,
        },
        required: {
            type: Boolean,
            value: false,
        },
        requiredPosition: {
            type: String,
            value: 'right',
        },
        firstIcon: {
            type: Object,
            value: {},
        },
        lastIcon: {
            type: Object,
            value: {},
        },
        desc: {
            type: String,
            value: '',
        },
        descColor: {
            type: String,
            value: COLOR.MINOR_TEXT_COLOR,
        },
        showLine: {
            type: Boolean,
            value: false,
        },
    },
});
