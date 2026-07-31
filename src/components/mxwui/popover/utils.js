function getStyle(obj) {
    return Object.keys(obj)
        .map((key) => `${key}: ${obj[key]}px`)
        .join(';');
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 根据 placement 推算气泡在视口中的矩形（未做贴边位移前）
 */
function getContentViewportRect(placement, size, arrowMargin) {
    const {childrenRect, contentRect} = size;
    const width = contentRect.width;
    const height = contentRect.height;
    const centerX = childrenRect.left + childrenRect.width / 2;
    const centerY = childrenRect.top + childrenRect.height / 2;

    if (placement === 'top') {
        return {
            left: centerX - width / 2,
            top: childrenRect.top - arrowMargin - height,
            width,
            height,
        };
    }
    if (placement === 'bottom') {
        return {
            left: centerX - width / 2,
            top: childrenRect.bottom + arrowMargin,
            width,
            height,
        };
    }
    if (placement === 'left') {
        return {
            left: childrenRect.left - arrowMargin - width,
            top: centerY - height / 2,
            width,
            height,
        };
    }
    if (placement === 'right') {
        return {
            left: childrenRect.right + arrowMargin,
            top: centerY - height / 2,
            width,
            height,
        };
    }
    if (placement === 'top-left') {
        return {
            left: childrenRect.left,
            top: childrenRect.top - arrowMargin - height,
            width,
            height,
        };
    }
    if (placement === 'top-right') {
        return {
            left: childrenRect.right - width,
            top: childrenRect.top - arrowMargin - height,
            width,
            height,
        };
    }
    if (placement === 'bottom-left') {
        return {
            left: childrenRect.left,
            top: childrenRect.bottom + arrowMargin,
            width,
            height,
        };
    }
    if (placement === 'bottom-right') {
        return {
            left: childrenRect.right - width,
            top: childrenRect.bottom + arrowMargin,
            width,
            height,
        };
    }
    if (placement === 'left-top') {
        return {
            left: childrenRect.left - arrowMargin - width,
            top: childrenRect.top,
            width,
            height,
        };
    }
    if (placement === 'left-bottom') {
        return {
            left: childrenRect.left - arrowMargin - width,
            top: childrenRect.bottom - height,
            width,
            height,
        };
    }
    if (placement === 'right-top') {
        return {
            left: childrenRect.right + arrowMargin,
            top: childrenRect.top,
            width,
            height,
        };
    }
    if (placement === 'right-bottom') {
        return {
            left: childrenRect.right + arrowMargin,
            top: childrenRect.bottom - height,
            width,
            height,
        };
    }
    return {
        left: centerX - width / 2,
        top: childrenRect.top - arrowMargin - height,
        width,
        height,
    };
}

/**
 * 单一方向贴边位移：保持气泡完整落在视口内
 */
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

/**
 * 箭头指向触发器中心，并限制在气泡内侧
 */
function getArrowStyle(placement, childrenRect, contentViewportLeft, contentViewportTop, contentRect, shiftX, shiftY) {
    const triggerCenterX = childrenRect.left + childrenRect.width / 2;
    const triggerCenterY = childrenRect.top + childrenRect.height / 2;
    const bubbleLeft = contentViewportLeft + shiftX;
    const bubbleTop = contentViewportTop + shiftY;
    const arrowPadding = 16;

    if (
        placement === 'top' ||
        placement === 'top-left' ||
        placement === 'top-right' ||
        placement === 'bottom' ||
        placement === 'bottom-left' ||
        placement === 'bottom-right'
    ) {
        const arrowLeft = clamp(
            triggerCenterX - bubbleLeft,
            arrowPadding,
            Math.max(arrowPadding, contentRect.width - arrowPadding)
        );
        if (placement.indexOf('top') === 0) {
            return `left:${arrowLeft}px;right:auto;top:auto;bottom:2px;transform:translate(-50%,100%) rotate(180deg);`;
        }
        return `left:${arrowLeft}px;right:auto;bottom:auto;top:2px;transform:translate(-50%,-100%) rotate(0deg);`;
    }

    const arrowTop = clamp(
        triggerCenterY - bubbleTop,
        arrowPadding,
        Math.max(arrowPadding, contentRect.height - arrowPadding)
    );
    if (placement.indexOf('left') === 0) {
        return `top:${arrowTop}px;bottom:auto;left:auto;right:2px;transform:translate(75%,-50%) rotate(90deg);`;
    }
    return `top:${arrowTop}px;bottom:auto;right:auto;left:2px;transform:translate(-75%,-50%) rotate(-90deg);`;
}

function adjustPlacement(placement, autoAdjustOverflow, size, arrowMargin) {
    let adjustedPlacement = placement || 'top';
    if (!autoAdjustOverflow) {
        return adjustedPlacement;
    }

    const {childrenRect, contentRect, systemInfo} = size;
    const contentRectWidth = contentRect.width + arrowMargin;
    const contentRectHeight = contentRect.height + arrowMargin;

    if (adjustedPlacement === 'top') {
        if (childrenRect.top - contentRectHeight < 0) {
            adjustedPlacement = 'bottom';
        }
    } else if (adjustedPlacement === 'bottom') {
        if (childrenRect.bottom + contentRectHeight > systemInfo.windowHeight) {
            adjustedPlacement = 'top';
        }
    } else if (adjustedPlacement === 'left') {
        if (childrenRect.left - contentRectWidth < 0) {
            adjustedPlacement = 'right';
        }
    } else if (adjustedPlacement === 'right') {
        if (childrenRect.right + contentRectWidth > systemInfo.windowWidth) {
            adjustedPlacement = 'left';
        }
    } else if (adjustedPlacement === 'top-left') {
        if (childrenRect.top - contentRectHeight < 0) {
            adjustedPlacement = adjustedPlacement.replace('top', 'bottom');
        }
        if (childrenRect.left + contentRectWidth > systemInfo.windowWidth) {
            adjustedPlacement = adjustedPlacement.replace('left', 'right');
        }
    } else if (adjustedPlacement === 'top-right') {
        if (childrenRect.top - contentRectHeight < 0) {
            adjustedPlacement = adjustedPlacement.replace('top', 'bottom');
        }
        if (childrenRect.right - contentRectWidth < 0) {
            adjustedPlacement = adjustedPlacement.replace('right', 'left');
        }
    } else if (adjustedPlacement === 'bottom-left') {
        if (childrenRect.bottom + contentRectHeight > systemInfo.windowHeight) {
            adjustedPlacement = adjustedPlacement.replace('bottom', 'top');
        }
        if (childrenRect.left + contentRectWidth > systemInfo.windowWidth) {
            adjustedPlacement = adjustedPlacement.replace('left', 'right');
        }
    } else if (adjustedPlacement === 'bottom-right') {
        if (childrenRect.bottom + contentRectHeight > systemInfo.windowHeight) {
            adjustedPlacement = adjustedPlacement.replace('bottom', 'top');
        }
        if (childrenRect.right - contentRectWidth < 0) {
            adjustedPlacement = adjustedPlacement.replace('right', 'left');
        }
    } else if (adjustedPlacement === 'left-top') {
        if (childrenRect.left - contentRectWidth < 0) {
            adjustedPlacement = adjustedPlacement.replace('left', 'right');
        }
        if (childrenRect.top + contentRectHeight > systemInfo.windowHeight) {
            adjustedPlacement = adjustedPlacement.replace('top', 'bottom');
        }
    } else if (adjustedPlacement === 'left-bottom') {
        if (childrenRect.left - contentRectWidth < 0) {
            adjustedPlacement = adjustedPlacement.replace('left', 'right');
        }
        if (childrenRect.bottom - contentRectHeight < 0) {
            adjustedPlacement = adjustedPlacement.replace('bottom', 'top');
        }
    } else if (adjustedPlacement === 'right-top') {
        if (childrenRect.right + contentRectWidth > systemInfo.windowWidth) {
            adjustedPlacement = adjustedPlacement.replace('right', 'left');
        }
        if (childrenRect.top + contentRectHeight > systemInfo.windowHeight) {
            adjustedPlacement = adjustedPlacement.replace('top', 'bottom');
        }
    } else if (adjustedPlacement === 'right-bottom') {
        if (childrenRect.right + contentRectWidth > systemInfo.windowWidth) {
            adjustedPlacement = adjustedPlacement.replace('right', 'left');
        }
        if (childrenRect.bottom - contentRectHeight < 0) {
            adjustedPlacement = adjustedPlacement.replace('bottom', 'top');
        }
    }

    return adjustedPlacement;
}

/**
 * 计算气泡定位样式：先翻转，再贴边位移，并校正箭头
 */
export function getPopoverStyle(placement, autoAdjustOverflow, size) {
    const {containerRect, childrenRect, contentRect, systemInfo} = size;
    const left = childrenRect.left - containerRect.left;
    const top = childrenRect.top - containerRect.top;
    const bottom = containerRect.bottom - childrenRect.bottom;
    const right = containerRect.right - childrenRect.right;
    const arrowMargin = 12;
    const edgeMargin = 12;

    const adjustedPlacement = adjustPlacement(
        placement,
        autoAdjustOverflow,
        size,
        arrowMargin
    );

    const viewportRect = getContentViewportRect(adjustedPlacement, size, arrowMargin);
    const {shiftX, shiftY} = autoAdjustOverflow
        ? getShift(viewportRect, systemInfo, edgeMargin)
        : {shiftX: 0, shiftY: 0};

    let popoverContentStyle = '';
    if (adjustedPlacement === 'top') {
        popoverContentStyle = getStyle({
            left: left + childrenRect.width / 2 + shiftX,
            top: top - arrowMargin + shiftY,
        });
    } else if (adjustedPlacement === 'bottom') {
        popoverContentStyle = getStyle({
            left: left + childrenRect.width / 2 + shiftX,
            bottom: bottom - arrowMargin - shiftY,
        });
    } else if (adjustedPlacement === 'left') {
        popoverContentStyle = getStyle({
            left: left - arrowMargin + shiftX,
            top: top + childrenRect.height / 2 + shiftY,
        });
    } else if (adjustedPlacement === 'right') {
        popoverContentStyle = getStyle({
            right: right - arrowMargin - shiftX,
            top: top + childrenRect.height / 2 + shiftY,
        });
    } else if (adjustedPlacement === 'top-left') {
        popoverContentStyle = getStyle({
            left: left + shiftX,
            top: top - arrowMargin + shiftY,
        });
    } else if (adjustedPlacement === 'top-right') {
        popoverContentStyle = getStyle({
            right: right - shiftX,
            top: top - arrowMargin + shiftY,
        });
    } else if (adjustedPlacement === 'bottom-left') {
        popoverContentStyle = getStyle({
            left: left + shiftX,
            bottom: bottom - arrowMargin - shiftY,
        });
    } else if (adjustedPlacement === 'bottom-right') {
        popoverContentStyle = getStyle({
            right: right - shiftX,
            bottom: bottom - arrowMargin - shiftY,
        });
    } else if (adjustedPlacement === 'left-top') {
        popoverContentStyle = getStyle({
            left: left - arrowMargin + shiftX,
            top: top + shiftY,
        });
    } else if (adjustedPlacement === 'left-bottom') {
        popoverContentStyle = getStyle({
            left: left - arrowMargin + shiftX,
            bottom: bottom - shiftY,
        });
    } else if (adjustedPlacement === 'right-top') {
        popoverContentStyle = getStyle({
            right: right - arrowMargin - shiftX,
            top: top + shiftY,
        });
    } else if (adjustedPlacement === 'right-bottom') {
        popoverContentStyle = getStyle({
            right: right - arrowMargin - shiftX,
            bottom: bottom - shiftY,
        });
    }

    const arrowStyle = getArrowStyle(
        adjustedPlacement,
        childrenRect,
        viewportRect.left,
        viewportRect.top,
        contentRect,
        shiftX,
        shiftY
    );

    return {
        popoverContentStyle,
        adjustedPlacement,
        arrowStyle,
    };
}
