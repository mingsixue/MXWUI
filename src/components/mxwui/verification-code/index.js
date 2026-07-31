import {COLOR} from '../utils/common';

function buildDigitList(digit) {
    const len = Math.max(1, Number(digit) || 4);
    const list = [];
    for (let i = 0; i < len; i++) {
        list.push(i);
    }
    return list;
}

Component({
    properties: {
        // 样式类型，dialog 弹窗类型 / form 表单类型
        styleType: {
            type: String,
            value: 'form'
        },
        // 是否显示
        visible: {
            type: Boolean,
            value: false,
            observer(newVal) {
                if (newVal && this.data.styleType == 'dialog') {
                    this.resetCaptcha();
                    this.clearFocusTimer();
                    // 弹层动画后再聚焦，避免首次唤起失败
                    this._focusTimer = setTimeout(() => {
                        this._focusTimer = null;
                        this.setData({inputFocus: true, activeIndex: 0});
                    }, 300);
                } else if (!newVal) {
                    this.clearFocusTimer();
                    this.setData({inputFocus: false, keyboardHeight: 0});
                }
            }
        },
        // 手机号
        phone: {
            type: Number,
            value: '',
            observer(phone) {
                const regex = /^(\d{3})(\d{4})(\d{4})$/;
                let phoneString = String(phone).replace(regex, '$1-$2-$3');
                this.setData({
                    phoneString
                });
            }
        },
        // 验证码位数 4 或 6
        digit: {
            type: Number,
            value: 4,
            observer(digit) {
                this.setData({
                    digitList: buildDigitList(digit)
                });
            }
        },
        // 倒计时秒数
        countdown: {
            type: Number,
            value: 60
        },
        // 是否禁用获取验证码按钮
        disabled: {
            type: Boolean,
            value: false
        },
        // 发送/获取验证码 按钮颜色
        sendBtnColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 确定按钮文案
        confirmBtnText: {
            type: String,
            value: '确定'
        },
        // 确定按钮颜色
        confirmBtnColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 光标颜色
        cursorColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 占位文本
        placeholder: {
            type: String,
            value: '请输入验证码'
        },
        // 占位文本颜色
        placeholderColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 标签文本位置，inline 内联 / block 独占一行
        labelPosition: {
            type: String,
            value: 'inline'
        },
        // 标签文本
        label: {
            type: String,
            value: ''
        },
        // 标签文本文本色
        labelColor: {
            type: String,
            value: ''
        },
        // 标签对齐方式， left / center / right
        labelAlign: {
            type: String,
            value: 'left'
        },
        // 标签文本自定义宽度，不带单位
        leftWidth: {
            type: Number,
            value: null
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
        // 标签前图标配置
        firstIcon: {
            type: Object,
            value: {}
        },
        // 标签后图标配置
        lastIcon: {
            type: Object,
            value: {}
        },
        // 描述
        desc: {
            type: String,
            value: ''
        },
        // 描述文本色
        descColor: {
            type: String,
            value: ''
        },
        // 是否显示分隔线
        showLine: {
            type: Boolean,
            value: false
        },
        PLACEHOLDER_COLOR: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        TEXT_COLOR: {
            type: String,
            value: COLOR.TEXT_COLOR
        },
        WHITE_COLOR: {
            type: String,
            value: COLOR.WHITE_COLOR
        }
    },
    data: {
        digitList: buildDigitList(4),
        code: [],
        codeValue: '',
        len: 0,
        activeIndex: 0,
        inputFocus: false,
        keyboardHeight: 0,
        replaceMode: false,
        isSend: false,
        time: 0,
        phoneString: ''
    },
    lifetimes: {
        detached() {
            this.clearCountdownTimer();
            this.clearFocusTimer();
        },
    },
    methods: {
        clearCountdownTimer() {
            if (this._countdownTimer) {
                clearTimeout(this._countdownTimer);
                this._countdownTimer = null;
            }
        },
        clearFocusTimer() {
            if (this._focusTimer) {
                clearTimeout(this._focusTimer);
                this._focusTimer = null;
            }
        },
        resetCaptcha() {
            this._replaceIndex = null;
            this.setData({
                code: [],
                codeValue: '',
                len: 0,
                activeIndex: 0,
                inputFocus: false,
                keyboardHeight: 0,
                replaceMode: false
            });
        },
        handleSend() {
            if (this.data.disabled) {
                return;
            }
            this.clearCountdownTimer();
            this.setData({
                isSend: true
            });
            this.countdowns(this.data.countdown);
            this.triggerEvent("verification_code_send");
        },
        countdowns(s) {
            let time = s - 1;
            if (time < 0) {
                this.setData({
                    time: 0,
                    isSend: false,
                });
                return;
            }
            this.setData({
                time: time
            });
            this.clearCountdownTimer();
            this._countdownTimer = setTimeout(() => {
                this._countdownTimer = null;
                this.countdowns(time);
            }, 1000);
        },
        handleClose(e) {
            this.clearFocusTimer();
            this._replaceIndex = null;
            this.setData({inputFocus: false, keyboardHeight: 0, replaceMode: false, activeIndex: -1});
            this.triggerEvent("verification_code_close", e.detail);
        },
        handleBack() {
            this.clearFocusTimer();
            this._replaceIndex = null;
            this.setData({inputFocus: false, keyboardHeight: 0, replaceMode: false, activeIndex: -1});
            this.triggerEvent("verification_code_back");
        },
        handleConfirm() {
            let {codeValue, digit} = this.data;
            if (!codeValue || codeValue.length !== digit) {
                return;
            }
            this._replaceIndex = null;
            this.setData({
                visible: false,
                inputFocus: false,
                keyboardHeight: 0,
                replaceMode: false,
                activeIndex: -1
            });
            this.triggerEvent("verification_code_confirm", {code: codeValue});
        },
        // 点击某一格：已填则可单独替换该位；未填则从该位继续输入
        handleCellTap(e) {
            if (!this.data.visible) return;
            const index = Number(e.currentTarget.dataset.index);
            if (Number.isNaN(index)) return;

            const {code, len, digit, inputFocus} = this.data;
            // 不能跳过空位往前点
            if (index > len) return;

            const hasDigit = !!code[index];
            if (hasDigit) {
                // 替换模式：保留其他位，仅改当前格；input 临时清空以便接收按键
                this._replaceIndex = index;
                this._ignoreEmptyInput = true;
                this.setData({
                    activeIndex: index,
                    inputFocus: true,
                    replaceMode: true,
                    codeValue: ''
                });
            } else {
                // 当前待填格：正常聚焦续输
                this._replaceIndex = null;
                const patch = {
                    activeIndex: Math.min(index, digit - 1),
                    replaceMode: false,
                    codeValue: code.join('')
                };
                if (!inputFocus) patch.inputFocus = true;
                this.setData(patch);
            }
        },
        handleCaptchaBlur() {
            this._replaceIndex = null;
            this.setData({
                inputFocus: false,
                keyboardHeight: 0,
                replaceMode: false,
                activeIndex: -1,
                codeValue: this.data.code.join('')
            });
        },
        handleKeyboardHeightChange(e) {
            const height = (e && e.detail && e.detail.height) || 0;
            this.setData({keyboardHeight: height});
        },
        handleCaptchaInput(e) {
            const digit = this.data.digit;
            const raw = e.detail.value == null ? '' : String(e.detail.value);
            const incoming = raw.replace(/\D/g, '');

            // 单独替换某一格
            if (this._replaceIndex != null) {
                const idx = this._replaceIndex;
                const prevCode = this.data.code.slice();

                if (!incoming) {
                    // 进入替换模式清空 input 时可能回调空值，忽略一次
                    if (this._ignoreEmptyInput) {
                        this._ignoreEmptyInput = false;
                        return;
                    }
                    // 删除：从当前格起清空
                    const nextVal = prevCode.slice(0, idx).join('');
                    this._replaceIndex = null;
                    this.setData({
                        code: nextVal.split(''),
                        codeValue: nextVal,
                        len: nextVal.length,
                        activeIndex: Math.min(idx, digit - 1),
                        replaceMode: false
                    });
                    return;
                }
                this._ignoreEmptyInput = false;

                const typed = incoming[incoming.length - 1];
                const nextCode = prevCode.slice();
                while (nextCode.length <= idx) nextCode.push('');
                nextCode[idx] = typed;
                const val = nextCode.slice(0, digit).join('');
                const nextIndex = idx + 1;
                const isComplete = val.length >= digit;

                this._replaceIndex = null;
                this.setData({
                    code: val.split(''),
                    codeValue: val,
                    len: val.length,
                    // 输满后取消选中；未满则移到下一格
                    activeIndex: isComplete ? -1 : Math.min(nextIndex, digit - 1),
                    replaceMode: false
                });

                if (isComplete) {
                    setTimeout(() => {
                        this.setData({inputFocus: false, keyboardHeight: 0, activeIndex: -1});
                    }, 50);
                }
                return;
            }

            const val = incoming.slice(0, digit);
            const code = val.split('');
            const len = val.length;
            const isComplete = len >= digit;
            // 输满后取消选中；未满则停在下一空位
            const activeIndex = isComplete ? -1 : len;

            this.setData({
                codeValue: val,
                code,
                len,
                activeIndex,
                replaceMode: false
            });

            // 输满后收起键盘（延后一拍，避免真机同次 input 内失焦无效）
            if (isComplete && this.data.inputFocus) {
                setTimeout(() => {
                    this.setData({inputFocus: false, keyboardHeight: 0, activeIndex: -1});
                }, 50);
            }
        },
        handleInputCode(e) {
            let val = e.detail.value;
            if (val.length == this.data.digit) {
                this.triggerEvent("verification_code_confirm", {code: val});
            }
        },
        handleFirstClick() {
            this.triggerEvent("verification_code_firstIcon");
        },
        handleLastClick() {
            this.triggerEvent("verification_code_lastIcon");
        }
    }
});
