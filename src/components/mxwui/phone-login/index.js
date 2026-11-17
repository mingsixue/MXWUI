import {COLOR} from '../utils/common';

const DEFAULT_PROTOCOL = [
    {text: '我已阅读并同意', color: COLOR.MINOR_TEXT_COLOR},
    {text: '《用户协议》', color: '#1F4886', type: 'user'},
    {text: '和', color: COLOR.MINOR_TEXT_COLOR},
    {text: '《隐私政策》', color: '#1F4886', type: 'privacy'},
];

Component({
    properties: {
        // 验证模式：quick 快速验证 / realtime 实时验证
        mode: {
            type: String,
            value: 'quick'
        },
        // Logo 图片地址
        logo: {
            type: String,
            value: ''
        },
        // Logo 尺寸，单位 rpx
        logoSize: {
            type: Number,
            value: 128
        },
        // 标题
        title: {
            type: String,
            value: '手机号登录'
        },
        // 副标题 / 描述
        desc: {
            type: String,
            value: '未注册的手机号验证后将自动创建账号'
        },
        // 登录按钮文案
        btnText: {
            type: String,
            value: '手机号一键登录'
        },
        // 按钮类型 primary / default / ghost
        btnType: {
            type: String,
            value: 'primary'
        },
        // 按钮主题色（十六进制）
        themeColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 按钮宽度
        btnWidth: {
            type: String,
            value: '702rpx'
        },
        // 是否圆角按钮
        round: {
            type: Boolean,
            value: true
        },
        // 是否禁用
        disabled: {
            type: Boolean,
            value: false
        },
        // 是否展示协议
        showProtocol: {
            type: Boolean,
            value: true
        },
        // 协议内容
        protocolContent: {
            type: Array,
            value: DEFAULT_PROTOCOL
        },
        // 协议是否选中
        protocolChecked: {
            type: Boolean,
            value: false
        },
        // 是否必须勾选协议后才能授权
        requireProtocol: {
            type: Boolean,
            value: true
        },
        // 未勾选协议时的提示文案
        protocolTip: {
            type: String,
            value: '请先阅读并同意相关协议'
        },
        // 额度用尽时是否展示平台默认提示
        phoneNumberNoQuotaToast: {
            type: Boolean,
            value: true
        },
        // 授权成功后是否自动调用 wx.login，一并返回 loginCode
        autoWxLogin: {
            type: Boolean,
            value: false
        },
        // 协议复选框未选中颜色
        checkboxColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 协议复选框选中颜色
        checkboxSelectColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 协议复选框大小
        checkboxSize: {
            type: Number,
            value: 32
        },
    },
    data: {
        innerChecked: false,
        openType: 'getPhoneNumber',
        canAuthorize: false,
    },
    observers: {
        protocolChecked(val) {
            this.setData({innerChecked: !!val}, () => {
                this._syncState();
            });
        },
        'mode, disabled, showProtocol, requireProtocol, innerChecked': function() {
            this._syncState();
        },
    },
    lifetimes: {
        attached() {
            this.setData({
                innerChecked: !!this.data.protocolChecked,
            }, () => {
                this._syncState();
            });
        },
    },
    methods: {
        _syncState() {
            const {
                mode,
                disabled,
                showProtocol,
                requireProtocol,
                innerChecked,
            } = this.data;
            const canAuthorize = !disabled && !(showProtocol && requireProtocol && !innerChecked);
            this.setData({
                openType: mode === 'realtime' ? 'getRealtimePhoneNumber' : 'getPhoneNumber',
                canAuthorize,
            });
        },
        handleBlockedTap() {
            if (this.data.disabled) return;
            if (this.data.showProtocol && this.data.requireProtocol && !this.data.innerChecked) {
                wx.showToast({
                    title: this.data.protocolTip || '请先阅读并同意相关协议',
                    icon: 'none',
                });
                this.triggerEvent('phone_login_blocked', {
                    reason: 'protocol',
                    tip: this.data.protocolTip,
                });
            }
        },
        handleProtocolChange(e) {
            const checked = !!(e.detail && e.detail.checked);
            this.setData({innerChecked: checked}, () => {
                this._syncState();
            });
            this.triggerEvent('protocol_change', {checked});
        },
        handleProtocolClick(e) {
            this.triggerEvent('protocol_click', e.detail || {});
        },
        handleGetPhoneNumber(e) {
            this._handlePhoneResult(e.detail || {}, 'quick');
        },
        handleGetRealtimePhoneNumber(e) {
            this._handlePhoneResult(e.detail || {}, 'realtime');
        },
        _handlePhoneResult(detail, mode) {
            const errMsg = detail.errMsg || '';
            const denied = /deny|cancel/i.test(errMsg) && !detail.code && !detail.encryptedData;
            if (denied) {
                this.triggerEvent('phone_login_fail', {
                    type: 'deny',
                    mode,
                    ...detail,
                });
                return;
            }

            if (detail.errno === 1400001) {
                this.triggerEvent('phone_login_fail', {
                    type: 'quota',
                    mode,
                    ...detail,
                });
                return;
            }

            const ok = !!(detail.code || detail.encryptedData);
            if (!ok) {
                this.triggerEvent('phone_login_fail', {
                    type: 'fail',
                    mode,
                    ...detail,
                });
                return;
            }

            const payload = {
                type: 'success',
                mode,
                code: detail.code || '',
                encryptedData: detail.encryptedData || '',
                iv: detail.iv || '',
                cloudID: detail.cloudID || '',
                ...detail,
            };

            if (!this.data.autoWxLogin) {
                this.triggerEvent('phone_login_success', payload);
                return;
            }

            wx.login({
                success: (res) => {
                    this.triggerEvent('phone_login_success', {
                        ...payload,
                        loginCode: res.code || '',
                    });
                },
                fail: (err) => {
                    this.triggerEvent('phone_login_success', {
                        ...payload,
                        loginCode: '',
                        loginError: err,
                    });
                },
            });
        },
    },
});
