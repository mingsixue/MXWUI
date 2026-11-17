/**
 * 弹层打开时锁定页面滚动，避免滑动穿透
 * 支持多层弹窗嵌套（引用计数）
 */
let lockCount = 0;

function setPageOverflow(overflow) {
    try {
        if (typeof wx !== 'undefined' && typeof wx.setPageStyle === 'function') {
            wx.setPageStyle({
                style: {
                    overflow,
                },
            });
        }
    } catch (e) {
        // ignore
    }
}

export function lockPageScroll() {
    lockCount += 1;
    if (lockCount === 1) {
        setPageOverflow('hidden');
    }
}

export function unlockPageScroll() {
    if (lockCount <= 0) {
        lockCount = 0;
        return;
    }
    lockCount -= 1;
    if (lockCount === 0) {
        setPageOverflow('auto');
    }
}
