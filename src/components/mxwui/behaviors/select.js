/**
 * 单选/多选列表通用 toggle
 * allowDeselect: 单选时是否允许再次点击取消
 */
export default Behavior({
    properties: {
        options: {
            type: Array,
            value: [],
        },
        // single / multiple
        mode: {
            type: String,
            value: 'single',
        },
        allowDeselect: {
            type: Boolean,
            value: false,
        },
    },
    methods: {
        toggleOption(idx) {
            const options = (this.data.options || []).map((item) => ({ ...item }));
            if (!options[idx] || options[idx].disabled) {
                return null;
            }

            // list-select 用 type；radio/checkbox-group 用 mode
            const mode = this.data.type || this.data.mode || 'single';
            if (mode === 'multiple') {
                options[idx].checked = !options[idx].checked;
            } else {
                options.forEach((item, index) => {
                    if (index === idx) {
                        item.checked = this.data.allowDeselect ? !item.checked : true;
                    } else {
                        item.checked = false;
                    }
                });
            }

            this.setData({ options });
            return {
                index: idx,
                checked: options[idx].checked,
                value: options[idx].value,
                item: options[idx],
                options,
            };
        },
    },
});
