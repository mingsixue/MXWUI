// 常量配置
import { COLOR } from './theme';

// Nav配置
const HOME_URL = '/pages/index/index'; // 默认首页
const DEFAULT_ICON = 'arrows_left'; // 默认返回图标
const DEFAULT_ICON_HOME = 'home'; // 默认首页图标

// 头像
const AVATAR = 'https://cdn.mingsixue.com/xcx/MXWUI/avatar.png';

const hexToRGBA = function(hex, opacity = 1) {
    if (hex.indexOf('rgba') != -1) {
        const regex = /rgba\(\d{1,3},\s\d{1,3},\s\d{1,3},([^)]+)\)/;
        const match = hex.match(regex);
        if (match && match[1]) {
            hex = hex.replace(match[1], opacity);
        }
        return hex;
    }
    var hexx = hex.replace("#", "0x");
    var r = hexx >> 16;
    var g = (hexx >> 8) & 0xff;
    var b = hexx & 0xff;
    return `rgba(${r}, ${g}, ${b},${opacity})`;
};

export {
    COLOR,
    HOME_URL,
    DEFAULT_ICON,
    DEFAULT_ICON_HOME,
    AVATAR,
    hexToRGBA
};
