/**
 * 上传组
 * 负责多文件布局与数量限制；单项选择/预览/删除委托 mx-upload。
 * 列表由业务受控维护：监听 upload_group_change 后更新 list。
 */
Component({
    properties: {
        // 上传类型：image / video / file
        type: {
            type: String,
            value: 'image'
        },
        // 一行多少个
        column: {
            type: Number,
            value: 3,
            observer(newVal) {
                this.dealWidth(newVal);
            }
        },
        // 最多限制
        limit: {
            type: Number,
            value: 9
        },
        // 宽度（不传则按 column 自动计算）
        width: {
            type: Number,
            value: 0
        },
        // 已上传列表 [{src, cover, status, percent, isFail}]
        list: {
            type: Array,
            value: []
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
        // 图片/视频来源
        sourceType: {
            type: Array,
            value: ['album', 'camera']
        },
        // 文件大小上限，单位字节
        maxSize: {
            type: Number,
            value: 0
        },
        // 上传区文案，空则按 type 自动生成（上传图片/视频/文件）
        chooseText: {
            type: String,
            value: ''
        },
    },
    data: {
        itemWidth: 223,
        addKey: 0,
        previewUrls: [],
    },
    lifetimes: {
        attached() {
            this.dealWidth(this.data.column);
            this._syncPreviewUrls(this.data.type, this.data.list);
        },
    },
    observers: {
        'width, column': function(width, column) {
            if (width > 0) {
                this.setData({itemWidth: width});
            } else {
                this.dealWidth(column);
            }
        },
        'type, list': function(type, list) {
            this._syncPreviewUrls(type, list);
        },
    },
    methods: {
        dealWidth(column) {
            if (this.data.width > 0) {
                this.setData({itemWidth: this.data.width});
                return;
            }
            const cols = Number(column) || 3;
            const itemWidth = (702 - (16 * (cols - 1))) / cols;
            this.setData({itemWidth});
        },
        _syncPreviewUrls(type, list) {
            const items = list || [];
            let previewUrls = [];
            if (type === 'image') {
                previewUrls = items.map((item) => item && item.src).filter(Boolean);
            } else if (type === 'video') {
                previewUrls = items.filter((item) => item && item.src).map((item) => ({
                    url: item.src,
                    poster: item.cover || '',
                }));
            }
            this.setData({previewUrls});
        },
        _cloneList() {
            return (this.data.list || []).map((item) => ({...(item || {})}));
        },
        _createUid() {
            return `u_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        },
        _emitList(list, detail) {
            this.triggerEvent('upload_group_change', {
                list,
                ...detail,
            });
        },
        handleChange(e) {
            const idx = Number(e.currentTarget.dataset.idx);
            const detail = e.detail || {};
            const list = this._cloneList();

            if (detail.type === 'del') {
                if (idx >= 0 && idx < list.length) {
                    list.splice(idx, 1);
                }
                this.setData({addKey: this.data.addKey + 1});
                this._emitList(list, {...detail, index: idx});
                return;
            }

            if (detail.type === 'choose' || detail.type === 'retry') {
                const prev = list[idx] || {};
                const nextItem = {
                    ...prev,
                    uid: prev.uid || this._createUid(),
                    src: detail.src || '',
                    cover: detail.cover || '',
                    status: detail.type === 'retry' ? 'uploading' : (detail.status || ''),
                    percent: detail.type === 'retry' ? 0 : prev.percent || 0,
                    isFail: false,
                    file: detail.file,
                };
                if (idx >= list.length) {
                    list.push(nextItem);
                } else {
                    list[idx] = nextItem;
                }
                // 重建添加入口，避免旧实例残留预览态
                if (detail.type === 'choose') {
                    this.setData({addKey: this.data.addKey + 1});
                }
                this._emitList(list, {
                    ...detail,
                    index: Math.min(Math.max(idx, 0), list.length - 1),
                    uid: nextItem.uid,
                });
                return;
            }

            this._emitList(list, {...detail, index: idx});
        },
        handleChoose(e) {
            const idx = Number(e.currentTarget.dataset.idx);
            this.triggerEvent('upload_group_choose', {
                ...(e.detail || {}),
                index: idx,
            });
        },
        handleRetry(e) {
            const idx = Number(e.currentTarget.dataset.idx);
            this.triggerEvent('upload_group_retry', {
                ...(e.detail || {}),
                index: idx,
            });
        },
        handleOversize(e) {
            const idx = Number(e.currentTarget.dataset.idx);
            this.triggerEvent('upload_group_oversize', {
                ...(e.detail || {}),
                index: idx,
            });
        },
    }
});
