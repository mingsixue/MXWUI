import XCX from '@utils/index';

const CATEGORIES = [
    {
        key: 'basic',
        name: '基础',
        desc: '无标签的简洁输入组合',
        color: '#CA0E2D',
        bg: 'rgba(202, 14, 45, 0.08)',
        icon: 'edit',
        list: [
            {
                label: '基础表单',
                desc: '纯占位输入，适合快速录入',
                tag: '默认',
                icon: 'edit2',
                url: '/pages/template/form/one/index',
            },
        ],
    },
    {
        key: 'list',
        name: '列表布局',
        desc: '带标签的列表式表单',
        color: '#098562',
        bg: 'rgba(9, 133, 98, 0.08)',
        icon: 'list2',
        list: [
            {
                label: '横向布局',
                desc: '标签与输入左右排列',
                tag: 'horizontal',
                icon: 'list',
                url: '/pages/template/form/two/index',
            },
            {
                label: '纵向布局',
                desc: '标签在上、输入在下',
                tag: 'vertical',
                icon: 'list4',
                url: '/pages/template/form/three/index',
            },
        ],
    },
    {
        key: 'web',
        name: 'Web 风格',
        desc: '接近网页表单的视觉与排布',
        color: '#C2996C',
        bg: 'rgba(194, 153, 108, 0.12)',
        icon: 'table',
        list: [
            {
                label: '纵向布局',
                desc: 'Web 风格，标签在上',
                tag: 'web',
                icon: 'notepad',
                url: '/pages/template/form/four/index',
            },
            {
                label: '横向布局',
                desc: 'Web 风格，标签与输入横排',
                tag: 'web + horizontal',
                icon: 'list3',
                url: '/pages/template/form/five/index',
            },
            {
                label: '右对齐标签',
                desc: '固定标签宽，右对齐更规整',
                tag: 'labelAlign',
                icon: 'choice',
                url: '/pages/template/form/six/index',
            },
        ],
    },
];

Page({
    data: {
        navHeight: XCX.getNavHeight(),
        total: CATEGORIES.reduce((sum, item) => sum + item.list.length, 0),
        activeKey: CATEGORIES[0].key,
        tabs: CATEGORIES.map((item) => ({
            key: item.key,
            name: item.name,
            count: item.list.length,
        })),
        categories: CATEGORIES,
    },

    _scrolling: false,
    _scrollTimer: null,

    handleTab(e) {
        const { key } = e.currentTarget.dataset;
        if (!key) return;

        this.setData({ activeKey: key });
        this._scrollToSection(key);
    },

    _scrollToSection(key) {
        this._scrolling = true;
        if (this._scrollTimer) clearTimeout(this._scrollTimer);

        const query = wx.createSelectorQuery();
        query.select('.tabsSticky').boundingClientRect();
        query.select(`#section-${key}`).boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec((res) => {
            const tabsRect = res[0];
            const sectionRect = res[1];
            const scroll = res[2];
            if (!sectionRect || !scroll) {
                this._scrolling = false;
                return;
            }

            const stickyTop = this.data.navHeight + (tabsRect ? tabsRect.height : 0);
            const scrollTop = scroll.scrollTop + sectionRect.top - stickyTop;

            wx.pageScrollTo({
                scrollTop: Math.max(0, scrollTop),
                duration: 300,
            });

            this._scrollTimer = setTimeout(() => {
                this._scrolling = false;
            }, 350);
        });
    },

    onPageScroll() {
        if (this._scrolling) return;
        if (this._spyLock) return;
        this._spyLock = true;

        setTimeout(() => {
            this._spyLock = false;
            this._syncActiveByScroll();
        }, 80);
    },

    _syncActiveByScroll() {
        if (this._scrolling) return;

        const stickyTop = this.data.navHeight + 48;
        const query = wx.createSelectorQuery();
        CATEGORIES.forEach((item) => {
            query.select(`#section-${item.key}`).boundingClientRect();
        });
        query.exec((rects) => {
            if (!rects || !rects.length) return;

            let activeKey = CATEGORIES[0].key;
            for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];
                if (rect && rect.top <= stickyTop + 24) {
                    activeKey = CATEGORIES[i].key;
                }
            }

            if (activeKey !== this.data.activeKey) {
                this.setData({ activeKey });
            }
        });
    },

    handleGo(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        wx.navigateTo({ url });
    },
});
