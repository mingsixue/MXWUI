// 获取导航栏高度
const getNavHeight = () => {
    const { statusBarHeight } = wx.getSystemInfoSync();
    const height = statusBarHeight + 44;
    return height;
};

const XCX = {
    getNavHeight,
};

export default XCX;
