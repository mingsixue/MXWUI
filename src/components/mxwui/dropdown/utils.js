function getStyle(obj) {
    return Object.keys(obj)
        .map((key) => `${key}: ${obj[key]}px`)
        .join(';');
}

function getContentViewportRect(placement, size, gap) {
    const {childrenRect, contentRect} = size;
    const width = contentRect.width;
    const height = contentRect.height;
    const centerX = childrenRect.left + childrenRect.width / 2;

    if (placement === 'bottom') {
        return {
            left: centerX - width / 2,
            top: childrenRect.bottom + gap,
            width,
            height,
        };
    }
    if (placement === 'bottom-left') {
        return {
            left: childrenRect.left,
            top: childrenRect.bottom + gap,
            width,
            height,
        };
    }
    if (placement === 'bottom-right') {
        return {
            left: childrenRect.right - width,
            top: childrenRect.bottom + gap,
            width,
            height,
        };
    }
    if (placement === 'top') {
        return {
            left: centerX - width / 2,
            top: childrenRect.top - gap - height,
            width,
            height,
        };
    }
    if (placement === 'top-left') {
        return {
            left: childrenRect.left,
            top: childrenRect.top - gap - height,
            width,
            height,
        };
    }
    if (placement === 'top-right') {
        return {
            left: childrenRect.right - width,
            top: childrenRect.top - gap - height,
            width,
            height,
        };
    }
    return {
        left: childrenRect.left,
        top: childrenRect.bottom + gap,
        width,
        height,
    };
}

function getShift(contentRect, systemInfo, edgeMargin) {
    let shiftX = 0;
    let shiftY = 0;
    const maxLeft = systemInfo.windowWidth - edgeMargin - contentRect.width;
    const maxTop = systemInfo.windowHeight - edgeMargin - contentRect.height;

    if (contentRect.left < edgeMargin) {
        shiftX = edgeMargin - contentRect.left;
    } else if (contentRect.left > maxLeft) {
        shiftX = maxLeft - contentRect.left;
    }

    if (contentRect.top < edgeMargin) {
        shiftY = edgeMargin - contentRect.top;
    } else if (contentRect.top > maxTop) {
        shiftY = maxTop - contentRect.top;
    }

    return {shiftX, shiftY};
}

function adjustPlacement(placement, autoAdjustOverflow, size, gap) {
    let adjustedPlacement = placement || 'bottom-left';
    if (!autoAdjustOverflow) {
        return adjustedPlacement;
    }

    const {childrenRect, contentRect, systemInfo} = size;
    const contentRectHeight = contentRect.height + gap;
    const contentRectWidth = contentRect.width;

    if (adjustedPlacement.indexOf('bottom') === 0) {
        if (childrenRect.bottom + contentRectHeight > systemInfo.windowHeight) {
            adjustedPlacement = adjustedPlacement.replace('bottom', 'top');
        }
    } else if (adjustedPlacement.indexOf('top') === 0) {
        if (childrenRect.top - contentRectHeight < 0) {
            adjustedPlacement = adjustedPlacement.replace('top', 'bottom');
        }
    }

    if (adjustedPlacement.indexOf('left') > -1) {
        if (childrenRect.left + contentRectWidth > systemInfo.windowWidth) {
            adjustedPlacement = adjustedPlacement.replace('left', 'right');
        }
    } else if (adjustedPlacement.indexOf('right') > -1) {
        if (childrenRect.right - contentRectWidth < 0) {
            adjustedPlacement = adjustedPlacement.replace('right', 'left');
        }
    } else if (adjustedPlacement === 'top' || adjustedPlacement === 'bottom') {
        const centerX = childrenRect.left + childrenRect.width / 2;
        if (centerX - contentRectWidth / 2 < 0) {
            adjustedPlacement = `${adjustedPlacement}-left`;
        } else if (centerX + contentRectWidth / 2 > systemInfo.windowWidth) {
            adjustedPlacement = `${adjustedPlacement}-right`;
        }
    }

    return adjustedPlacement;
}

/**
 * 计算下拉菜单定位样式：先翻转，再贴边位移
 */
export function getDropdownStyle(placement, autoAdjustOverflow, size) {
    const {containerRect, childrenRect, contentRect, systemInfo} = size;
    const left = childrenRect.left - containerRect.left;
    const top = childrenRect.top - containerRect.top;
    const bottom = containerRect.bottom - childrenRect.bottom;
    const right = containerRect.right - childrenRect.right;
    const gap = 8;
    const edgeMargin = 12;

    const adjustedPlacement = adjustPlacement(
        placement,
        autoAdjustOverflow,
        size,
        gap
    );

    const viewportRect = getContentViewportRect(adjustedPlacement, size, gap);
    const {shiftX, shiftY} = autoAdjustOverflow
        ? getShift(viewportRect, systemInfo, edgeMargin)
        : {shiftX: 0, shiftY: 0};

    let menuStyle = '';
    if (adjustedPlacement === 'bottom') {
        menuStyle = getStyle({
            left: left + childrenRect.width / 2 + shiftX,
            top: top + childrenRect.height + gap + shiftY,
        });
    } else if (adjustedPlacement === 'bottom-left') {
        menuStyle = getStyle({
            left: left + shiftX,
            top: top + childrenRect.height + gap + shiftY,
        });
    } else if (adjustedPlacement === 'bottom-right') {
        menuStyle = getStyle({
            right: right - shiftX,
            top: top + childrenRect.height + gap + shiftY,
        });
    } else if (adjustedPlacement === 'top') {
        menuStyle = getStyle({
            left: left + childrenRect.width / 2 + shiftX,
            bottom: bottom + childrenRect.height + gap - shiftY,
        });
    } else if (adjustedPlacement === 'top-left') {
        menuStyle = getStyle({
            left: left + shiftX,
            bottom: bottom + childrenRect.height + gap - shiftY,
        });
    } else if (adjustedPlacement === 'top-right') {
        menuStyle = getStyle({
            right: right - shiftX,
            bottom: bottom + childrenRect.height + gap - shiftY,
        });
    }

    return {
        menuStyle,
        adjustedPlacement,
    };
}
