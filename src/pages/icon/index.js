import XCX from '@utils/index';

Page({
    data: {
        navHeight: XCX.getNavHeight(),
        sizes: [
            { value: 24, name: '极小', use: '角标、附属' },
            { value: 28, name: '较小', use: '列表箭头' },
            { value: 32, name: '常规', use: '正文旁图标' },
            { value: 36, name: '中等', use: '入口、标签' },
            { value: 44, name: '较大', use: '导航、操作' },
            { value: 48, name: '大号', use: '强调入口' },
            { value: 64, name: '特大', use: '空态、引导' },
        ],
        rules: [
            {
                title: '基准倍数',
                desc: '图标尺寸以 4 的倍数为基准，如 24、32、48，避免奇数或非对齐值。',
            },
            {
                title: '颜色跟随',
                desc: '默认跟随文本色；强调操作用主题色，次要用次要文本色，禁用用占位色。',
            },
            {
                title: '对齐方式',
                desc: '与相邻文字垂直居中对齐，左右留白与字号阶梯保持一致节奏。',
            },
        ],
        colors: [
            {
                name: '主色',
                color: '#CA0E2D',
                bg: 'rgba(202, 14, 45, 0.08)',
                icon: 'face_smile',
            },
            {
                name: '正文',
                color: '#040A23',
                bg: 'rgba(4, 10, 35, 0.06)',
                icon: 'home',
            },
            {
                name: '次要',
                color: '#656979',
                bg: 'rgba(101, 105, 121, 0.1)',
                icon: 'search',
            },
            {
                name: '成功',
                color: '#098562',
                bg: 'rgba(9, 133, 98, 0.08)',
                icon: 'checkbox_checked',
            },
        ],
    },
});
