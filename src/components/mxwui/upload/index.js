import {COLOR} from '../utils/common';

/**
 * 上传组件
 * 负责选择/预览/删除/上传态展示；实际上传由业务监听事件后完成，再回写 src/status。
 */
Component({
    properties: {
        // 上传类型：image / video / file
        type: {
            type: String,
            value: 'image'
        },
        // 图片路径/视频路径/文件路径
        src: {
            type: String,
            value: ''
        },
        // 封面图片地址（视频）
        cover: {
            type: String,
            value: ''
        },
        // 组件大小，单位 rpx；配合 small 且未改 width 时自动用小尺寸
        width: {
            type: Number,
            value: 233
        },
        // 是否小尺寸（缩小容器、图标与文案）
        small: {
            type: Boolean,
            value: false
        },
        // 状态：'' / uploading / done / fail
        status: {
            type: String,
            value: ''
        },
        // 是否上传失败（兼容旧用法，与 status=fail 等价）
        isFail: {
            type: Boolean,
            value: false
        },
        // 上传进度 0-100，仅 uploading 时展示
        percent: {
            type: Number,
            value: 0
        },
        // 是否禁用
        disabled: {
            type: Boolean,
            value: false
        },
        // 是否可删除
        deletable: {
            type: Boolean,
            value: true
        },
        // 图片/视频来源：album / camera
        sourceType: {
            type: Array,
            value: ['album', 'camera']
        },
        // 文件大小上限，单位字节，0 表示不限制
        maxSize: {
            type: Number,
            value: 0
        },
        // 上传区文案，空则按 type 自动生成
        chooseText: {
            type: String,
            value: ''
        },
        // 选择后是否本地预览回写 src（上传组添加入口应关闭，避免占住添加位）
        autoPreview: {
            type: Boolean,
            value: true
        },
        // 图片预览地址列表；传入后可左右滑动预览整组
        previewUrls: {
            type: Array,
            value: []
        },
        WHITE_COLOR: {
            type: String,
            value: COLOR.WHITE_COLOR
        },
        PLACEHOLDER_COLOR: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
    },
    data: {
        showFail: false,
        showUploading: false,
        displayText: '上传图片',
        boxWidth: 233,
        delIconSize: 44,
        addIconSize: 64,
    },
    observers: {
        'status, isFail': function(status, isFail) {
            this._syncStatus(status, isFail);
        },
        'type, chooseText': function(type, chooseText) {
            this._syncText(type, chooseText);
        },
        'width, small': function(width, small) {
            this._syncSize(width, small);
        },
    },
    lifetimes: {
        attached() {
            this._syncStatus(this.data.status, this.data.isFail);
            this._syncText(this.data.type, this.data.chooseText);
            this._syncSize(this.data.width, this.data.small);
        },
    },
    methods: {
        _syncStatus(status, isFail) {
            const fail = status === 'fail' || !!isFail;
            this.setData({
                showFail: fail,
                showUploading: status === 'uploading',
            });
        },
        _syncText(type, chooseText) {
            const map = {image: '图片', video: '视频', file: '文件'};
            this.setData({
                displayText: chooseText || `上传${map[type] || '文件'}`,
            });
        },
        _syncSize(width, small) {
            const DEFAULT_WIDTH = 233;
            const SMALL_WIDTH = 160;
            let boxWidth = Number(width) || DEFAULT_WIDTH;
            // small 且未自定义 width 时，使用小尺寸容器
            if (small && boxWidth === DEFAULT_WIDTH) {
                boxWidth = SMALL_WIDTH;
            }
            this.setData({
                boxWidth,
                delIconSize: small ? 36 : 44,
                addIconSize: small ? 42 : 64,
            });
        },
        handlePreview() {
            const {type, showUploading, showFail} = this.data;
            if (showUploading || showFail) {
                return;
            }
            if (type === 'image') {
                this.handleImage();
                return;
            }
            if (type === 'video') {
                this.handleVideo();
                return;
            }
            this.handleFile();
        },
        handleImage() {
            const {src, showUploading, previewUrls} = this.data;
            if (!src || showUploading) {
                return;
            }
            const urls = (previewUrls && previewUrls.length) ? previewUrls.filter(Boolean) : [src];
            wx.previewImage({
                current: src,
                urls: urls.length ? urls : [src],
            });
        },
        handleVideo() {
            const {src, cover, showUploading, previewUrls} = this.data;
            if (!src || showUploading) {
                return;
            }
            // previewUrls 在视频组中约定为 [{url, poster}] 或纯 url 列表
            let sources = [];
            if (previewUrls && previewUrls.length) {
                sources = previewUrls.map((item) => {
                    if (typeof item === 'string') {
                        return {url: item, type: 'video'};
                    }
                    return {
                        url: item.url || item.src || '',
                        type: 'video',
                        poster: item.poster || item.cover || '',
                    };
                }).filter((item) => !!item.url);
            }
            if (!sources.length) {
                sources = [{url: src, type: 'video', poster: cover}];
            }
            let current = 0;
            for (let i = 0; i < sources.length; i++) {
                if (sources[i].url === src) {
                    current = i;
                    break;
                }
            }
            wx.previewMedia({sources, current});
        },
        handleFile() {
            const {src, showUploading} = this.data;
            if (!src || showUploading) {
                return;
            }
            // 远程 http(s) 先下载；本地临时路径直接打开
            const isRemote = /^https?:\/\//i.test(src) && !/^https?:\/\/tmp\//i.test(src);
            if (!isRemote) {
                wx.openDocument({
                    filePath: src,
                    fail: () => {
                        wx.showToast({title: '无法打开文件', icon: 'none'});
                    }
                });
                return;
            }
            wx.downloadFile({
                url: src,
                success: (res) => {
                    wx.openDocument({
                        filePath: res.tempFilePath,
                        fail: () => {
                            wx.showToast({title: '无法打开文件', icon: 'none'});
                        }
                    });
                },
                fail: () => {
                    wx.showToast({title: '文件下载失败', icon: 'none'});
                }
            });
        },
        handleDel() {
            if (this.data.disabled || !this.data.deletable) {
                return;
            }
            this.setData({
                src: '',
                cover: '',
                status: '',
                isFail: false,
                percent: 0,
                showFail: false,
                showUploading: false,
            });
            this.triggerEvent('upload_change', {
                type: 'del',
                src: '',
                cover: '',
                status: '',
            });
        },
        handleRetry() {
            if (this.data.disabled) {
                return;
            }
            const {type, src, cover} = this.data;
            this.triggerEvent('upload_retry', {type, src, cover});
            this.triggerEvent('upload_change', {
                type: 'retry',
                src,
                cover,
                status: 'uploading',
            });
        },
        _oversize(file) {
            const {maxSize} = this.data;
            const size = file.size || 0;
            if (maxSize > 0 && size > maxSize) {
                this.triggerEvent('upload_oversize', {file, maxSize});
                wx.showToast({
                    title: '文件过大',
                    icon: 'none',
                });
                return true;
            }
            return false;
        },
        _emitChoose(payload) {
            const {src, cover, file} = payload;
            // 受控场景（如上传组添加位）关闭 autoPreview，避免本地 src 占住添加入口
            if (this.data.autoPreview) {
                this.setData({
                    src,
                    cover,
                    status: '',
                    isFail: false,
                    percent: 0,
                    showFail: false,
                    showUploading: false,
                });
            }
            this.triggerEvent('upload_change', {
                type: 'choose',
                src,
                cover,
                file,
                status: '',
            });
        },
        handleUpload() {
            const {type, disabled, sourceType} = this.data;
            if (disabled) {
                return;
            }

            this.triggerEvent('upload_choose', {type});

            if (type === 'image') {
                wx.chooseMedia({
                    count: 1,
                    mediaType: ['image'],
                    sourceType,
                    success: (res) => {
                        const file = res.tempFiles[0] || {};
                        if (this._oversize(file)) {
                            return;
                        }
                        const path = file.tempFilePath || '';
                        this._emitChoose({
                            src: path,
                            cover: path,
                            file,
                        });
                    },
                });
                return;
            }

            if (type === 'video') {
                wx.chooseMedia({
                    count: 1,
                    mediaType: ['video'],
                    sourceType,
                    success: (res) => {
                        const file = res.tempFiles[0] || {};
                        if (this._oversize(file)) {
                            return;
                        }
                        this._emitChoose({
                            src: file.tempFilePath || '',
                            cover: file.thumbTempFilePath || '',
                            file,
                        });
                    },
                });
                return;
            }

            wx.chooseMessageFile({
                count: 1,
                type: 'file',
                success: (res) => {
                    const file = (res.tempFiles && res.tempFiles[0]) || {};
                    if (this._oversize(file)) {
                        return;
                    }
                    this._emitChoose({
                        src: file.path || '',
                        cover: '',
                        file,
                    });
                },
            });
        },
    }
});
