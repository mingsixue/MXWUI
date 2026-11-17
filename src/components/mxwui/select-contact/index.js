import {COLOR} from '../utils/common';
import {
    buildRecommendSection,
    filterContacts,
    flattenContacts,
    getSectionId,
    groupContactsByLetter,
} from './utils';

Component({
    properties: {
        // 推荐联系人 [{ userId, displayName, avatar, loginId, tag, letter }]
        recommendList: {
            type: Array,
            value: [],
        },
        // 全部联系人
        contactList: {
            type: Array,
            value: [],
        },
        // 外部搜索结果（localSearch=false 时使用）
        searchResult: {
            type: Array,
            value: [],
        },
        // 组件高度
        height: {
            type: String,
            value: '100%',
        },
        // 搜索占位文案
        placeholder: {
            type: String,
            value: '输入手机号、邮箱、姓名查找',
        },
        // 是否展示搜索
        searchable: {
            type: Boolean,
            value: true,
        },
        // 是否本地搜索；false 时触发 select_contact_search，由外部回填 searchResult
        localSearch: {
            type: Boolean,
            value: true,
        },
        // 加载中
        loading: {
            type: Boolean,
            value: false,
        },
        // 搜索中（外部搜索时可受控）
        searching: {
            type: Boolean,
            value: false,
        },
        // 空状态文案
        emptyText: {
            type: String,
            value: '暂无联系人',
        },
        // 搜索无结果文案
        searchEmptyText: {
            type: String,
            value: '未找到相关联系人',
        },
        // 推荐区标题
        recommendTitle: {
            type: String,
            value: '推荐',
        },
        // 全部联系人标题
        contactTitle: {
            type: String,
            value: '全部联系人',
        },
        // 头像尺寸 rpx
        avatarSize: {
            type: Number,
            value: 72,
        },
        // 搜索高亮色
        highlightColor: {
            type: String,
            value: COLOR.THEME_COLOR,
        },
        // 标签色
        tagColor: {
            type: String,
            value: '#FF6010',
        },
        // 标签边框色
        tagBorderColor: {
            type: String,
            value: '#FFCFB7',
        },
        // 侧边索引尺寸 px
        indexSize: {
            type: Number,
            value: 16,
        },
        // 激活态颜色
        activeColor: {
            type: String,
            value: COLOR.THEME_COLOR,
        },
        // 根节点样式
        customStyle: {
            type: String,
            value: '',
        },
    },
    data: {
        showSearch: false,
        searchValue: '',
        searchStatus: 'normal', // normal | loading | empty
        searchList: [],
        recommendSections: [],
        contactSections: [],
        alphabet: [],
        scrollIntoView: '',
        contactListEmpty: false,
        currentKey: 0,
        touchKey: '',
        moving: false,
        showMask: false,
        itemHeight: 16,
        THEME_COLOR: COLOR.THEME_COLOR,
        PLACEHOLDER_COLOR: COLOR.PLACEHOLDER_COLOR,
        WHITE_COLOR: COLOR.WHITE_COLOR,
    },
    observers: {
        'recommendList, contactList, recommendTitle, contactTitle': function() {
            this._rebuildList();
        },
        'searchResult, searching': function(searchResult, searching) {
            if (this.data.localSearch) return;
            if (!this.data.showSearch) return;

            if (searching) {
                // 空关键词展示全部时，不进入 loading，避免闪烁
                if (!this.data.searchValue) return;
                this.setData({searchStatus: 'loading', searchList: []});
                return;
            }

            const list = (searchResult || []).map((item) => ({
                ...item,
                displayName: item.displayName || item.name || '',
                tag: item.tag || item.recommendTypeDesc || '',
                nodes: item.nodes || [{text: item.displayName || item.name || '', light: false}],
            }));

            this.setData({
                searchList: list,
                searchStatus: list.length ? 'normal' : 'empty',
            });
        },
    },
    lifetimes: {
        ready() {
            this._rebuildList();
            this._initItemHeight();
        },
    },
    methods: {
        _rebuildList() {
            try {
                const recommendSections = buildRecommendSection(
                    this.data.recommendList,
                    this.data.recommendTitle
                );
                let contactSections = groupContactsByLetter(this.data.contactList);
                if (contactSections.length && this.data.contactTitle) {
                    contactSections = contactSections.map((section, idx) => {
                        if (idx === 0 && section.className === 'first-level') {
                            return {...section, name: this.data.contactTitle};
                        }
                        return section;
                    });
                }

                const alphabet = [];
                recommendSections.forEach((item) => {
                    if (item.name === this.data.recommendTitle || item.name === '推荐') {
                        alphabet.push({label: '推', sectionId: item.sectionId});
                    }
                });
                contactSections.forEach((item) => {
                    if (item.className !== 'first-level') {
                        alphabet.push({label: item.name, sectionId: item.sectionId});
                    }
                });

                this.setData({
                    recommendSections,
                    contactSections,
                    alphabet,
                    contactListEmpty: !recommendSections.length && contactSections.length <= 1,
                });
            } catch (error) {
                this.triggerEvent('select_contact_error', {error});
                this.setData({contactListEmpty: true});
            }
        },

        _initItemHeight() {
            const query = this.createSelectorQuery();
            query.select('.mx-select-contact-side-content').boundingClientRect();
            query.select('#mx-sc-alphabet-0').boundingClientRect();
            query.exec((res) => {
                if (res && res[0]) {
                    this._sideTop = res[0].top;
                }
                if (res && res[1] && res[1].height) {
                    this.setData({itemHeight: res[1].height});
                }
            });
        },

        _buildSearchList(keyword = '') {
            const source = flattenContacts(this.data.recommendList, this.data.contactList);
            return filterContacts(source, keyword);
        },

        _applySearchList(list) {
            this.setData({
                searchList: list,
                searchStatus: list.length ? 'normal' : 'empty',
            });
        },

        handleSearchFocus() {
            const list = this._buildSearchList(this.data.searchValue || '');
            this.setData({showSearch: true});
            this._applySearchList(list);
        },

        handleSearchCancel() {
            this.setData({
                showSearch: false,
                searchValue: '',
                searchList: [],
                searchStatus: 'normal',
            });
            this.triggerEvent('select_contact_cancel');
        },

        handleSearchChange(e) {
            const value = (e.detail && e.detail.value) || '';
            this.setData({
                searchValue: value,
                showSearch: true,
            });

            // 未输入内容时查全部；外部搜索模式同样先回填本地全量，并通知业务方
            if (!this.data.localSearch && value) {
                this.setData({searchStatus: 'loading', searchList: []});
                this.triggerEvent('select_contact_search', {keyword: value});
                return;
            }

            if (!this.data.localSearch && !value) {
                this.triggerEvent('select_contact_search', {keyword: ''});
            }

            this._applySearchList(this._buildSearchList(value));
        },

        handleItemTap(e) {
            const {item, source} = e.currentTarget.dataset;
            if (!item) return;
            this.triggerEvent('select_contact_select', {
                userInfo: item,
                personSource: source || 'all',
            });
        },

        _getIndexByClientY(clientY) {
            const {alphabet, itemHeight} = this.data;
            if (!alphabet.length) return -1;
            const sideTop = this._sideTop || 0;
            let index = Math.floor((clientY - sideTop) / itemHeight);
            if (index < 0) index = 0;
            if (index > alphabet.length - 1) index = alphabet.length - 1;
            return index;
        },

        _selectIndex(index) {
            const {alphabet, currentKey} = this.data;
            const item = alphabet[index];
            if (!item) return;

            this.setData({
                currentKey: index,
                touchKey: item.label,
                scrollIntoView: `mx-sc-${item.sectionId || getSectionId(item.label)}`,
            });

            clearTimeout(this._scrollResetTimer);
            this._scrollResetTimer = setTimeout(() => {
                this.setData({scrollIntoView: ''});
            }, 300);

            if (currentKey !== index) {
                this.triggerEvent('select_contact_index', {
                    item,
                    index,
                    label: item.label,
                });
            }
        },

        onTouchStart(e) {
            const point = (e.touches && e.touches[0]) || {};
            const query = this.createSelectorQuery();
            query.select('.mx-select-contact-side-content').boundingClientRect();
            query.exec((res) => {
                if (res && res[0]) {
                    this._sideTop = res[0].top;
                }
                const index = this._getIndexByClientY(point.clientY || 0);
                this.setData({
                    moving: true,
                    showMask: true,
                    itemHeight: this.data.indexSize || 16,
                });
                this._selectIndex(index);
            });
        },

        onTouchMove(e) {
            if (!this.data.moving) return;
            const point = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
            if (!point) return;
            this._selectIndex(this._getIndexByClientY(point.clientY));
        },

        onTouchEnd() {
            if (!this.data.moving) return;
            this.setData({
                touchKey: '',
                showMask: false,
                moving: false,
            });
        },
    },
});
