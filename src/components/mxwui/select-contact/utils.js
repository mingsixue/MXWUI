/** 字母排序权重 */
export const AlphabetMap = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    I: 9, J: 10, K: 11, L: 12, M: 13, N: 14, O: 15, P: 16,
    Q: 17, R: 18, S: 19, T: 20, U: 21, V: 22, W: 23, X: 24,
    Y: 25, Z: 26, '#': 27,
};

/**
 * 常见汉字拼音首字母（偏姓氏/人名），用于通讯录分组。
 * 未命中时回退为 #；也可在联系人数据上显式传 letter。
 */
const CHAR_LETTER_MAP = {
    阿: 'A', 艾: 'A', 安: 'A', 敖: 'A',
    白: 'B', 包: 'B', 鲍: 'B', 毕: 'B', 边: 'B', 卞: 'B', 卜: 'B', 部: 'B', 冰: 'B',
    蔡: 'C', 曹: 'C', 岑: 'C', 柴: 'C', 昌: 'C', 常: 'C', 陈: 'C', 成: 'C', 程: 'C', 池: 'C', 褚: 'C', 崔: 'C', 翠: 'C',
    戴: 'D', 邓: 'D', 狄: 'D', 刁: 'D', 丁: 'D', 董: 'D', 窦: 'D', 杜: 'D', 段: 'D', 东: 'D', 大: 'D',
    鄂: 'E',
    樊: 'F', 范: 'F', 方: 'F', 房: 'F', 费: 'F', 冯: 'F', 凤: 'F', 伏: 'F', 福: 'F', 傅: 'F', 飞: 'F',
    甘: 'G', 高: 'G', 葛: 'G', 耿: 'G', 龚: 'G', 宫: 'G', 巩: 'G', 贡: 'G', 勾: 'G', 古: 'G', 谷: 'G', 顾: 'G', 关: 'G', 管: 'G', 桂: 'G', 郭: 'G', 果: 'G',
    韩: 'H', 杭: 'H', 郝: 'H', 何: 'H', 贺: 'H', 赫: 'H', 衡: 'H', 洪: 'H', 侯: 'H', 后: 'H', 胡: 'H', 花: 'H', 华: 'H', 怀: 'H', 桓: 'H', 黄: 'H', 霍: 'H', 浩: 'H', 黑: 'H',
    纪: 'J', 季: 'J', 贾: 'J', 简: 'J', 江: 'J', 姜: 'J', 蒋: 'J', 焦: 'J', 金: 'J', 靳: 'J', 经: 'J', 荆: 'J', 井: 'J', 景: 'J', 鞠: 'J', 居: 'J', 菊: 'J', 俊: 'J', 佳: 'J', 杰: 'J',
    阚: 'K', 康: 'K', 柯: 'K', 孔: 'K', 寇: 'K', 蒯: 'K', 匡: 'K', 邝: 'K', 况: 'K', 奎: 'K', 坤: 'K', 可: 'K',
    赖: 'L', 蓝: 'L', 郎: 'L', 劳: 'L', 乐: 'L', 雷: 'L', 冷: 'L', 黎: 'L', 李: 'L', 理: 'L', 厉: 'L', 利: 'L', 连: 'L', 廉: 'L', 梁: 'L', 廖: 'L', 林: 'L', 凌: 'L', 刘: 'L', 柳: 'L', 龙: 'L', 娄: 'L', 卢: 'L', 鲁: 'L', 陆: 'L', 路: 'L', 吕: 'L', 栾: 'L', 罗: 'L', 洛: 'L', 骆: 'L', 丽: 'L', 老: 'L', 玲: 'L',
    马: 'M', 满: 'M', 毛: 'M', 梅: 'M', 孟: 'M', 米: 'M', 苗: 'M', 闵: 'M', 明: 'M', 莫: 'M', 牟: 'M', 穆: 'M', 萌: 'M',
    那: 'N', 南: 'N', 倪: 'N', 年: 'N', 聂: 'N', 宁: 'N', 牛: 'N', 农: 'N', 娜: 'N',
    欧: 'O', 区: 'O',
    潘: 'P', 庞: 'P', 裴: 'P', 彭: 'P', 皮: 'P', 平: 'P', 蒲: 'P', 濮: 'P', 浦: 'P', 盼: 'P',
    戚: 'Q', 齐: 'Q', 钱: 'Q', 强: 'Q', 乔: 'Q', 秦: 'Q', 邱: 'Q', 秋: 'Q', 裘: 'Q', 屈: 'Q', 瞿: 'Q', 权: 'Q', 全: 'Q', 阙: 'Q', 倩: 'Q',
    冉: 'R', 饶: 'R', 任: 'R', 荣: 'R', 容: 'R', 阮: 'R', 芮: 'R', 柔: 'R',
    萨: 'S', 赛: 'S', 桑: 'S', 沙: 'S', 山: 'S', 单: 'S', 商: 'S', 尚: 'S', 邵: 'S', 佘: 'S', 申: 'S', 沈: 'S', 盛: 'S', 施: 'S', 石: 'S', 时: 'S', 史: 'S', 寿: 'S', 舒: 'S', 帅: 'S', 双: 'S', 水: 'S', 司: 'S', 松: 'S', 宋: 'S', 苏: 'S', 孙: 'S', 索: 'S', 珊: 'S', 思: 'S',
    台: 'T', 谭: 'T', 汤: 'T', 唐: 'T', 陶: 'T', 滕: 'T', 田: 'T', 童: 'T', 涂: 'T', 屠: 'T', 婷: 'T', 团: 'T',
    万: 'W', 汪: 'W', 王: 'W', 危: 'W', 韦: 'W', 卫: 'W', 魏: 'W', 温: 'W', 文: 'W', 闻: 'W', 翁: 'W', 巫: 'W', 邬: 'W', 吴: 'W', 伍: 'W', 武: 'W', 旺: 'W', 伟: 'W',
    西: 'X', 奚: 'X', 席: 'X', 习: 'X', 夏: 'X', 鲜: 'X', 咸: 'X', 相: 'X', 向: 'X', 项: 'X', 萧: 'X', 肖: 'X', 谢: 'X', 辛: 'X', 邢: 'X', 幸: 'X', 熊: 'X', 徐: 'X', 许: 'X', 宣: 'X', 薛: 'X', 小: 'X',
    严: 'Y', 言: 'Y', 颜: 'Y', 阎: 'Y', 晏: 'Y', 燕: 'Y', 杨: 'Y', 阳: 'Y', 姚: 'Y', 叶: 'Y', 伊: 'Y', 易: 'Y', 殷: 'Y', 尹: 'Y', 应: 'Y', 英: 'Y', 雍: 'Y', 尤: 'Y', 游: 'Y', 于: 'Y', 余: 'Y', 俞: 'Y', 虞: 'Y', 禹: 'Y', 宇: 'Y', 郁: 'Y', 喻: 'Y', 元: 'Y', 袁: 'Y', 岳: 'Y', 云: 'Y', 圆: 'Y', 雨: 'Y',
    臧: 'Z', 曾: 'Z', 詹: 'Z', 湛: 'Z', 张: 'Z', 章: 'Z', 赵: 'Z', 甄: 'Z', 郑: 'Z', 支: 'Z', 钟: 'Z', 周: 'Z', 朱: 'Z', 诸: 'Z', 祝: 'Z', 庄: 'Z', 卓: 'Z', 邹: 'Z', 祖: 'Z', 左: 'Z', 子: 'Z',
};

/**
 * 取展示名首字母（A-Z / #）
 * @param {string} str
 * @param {string} [letter] 显式指定
 */
export function getFirstLetterInMap(str = '', letter) {
    if (letter) {
        const L = String(letter).toUpperCase();
        return AlphabetMap[L] ? L : '#';
    }

    const text = String(str || '').trim();
    if (!text) return '#';

    // 跳过常见前缀符号，尽量取到有效字符
    let ch = text.charAt(0);
    for (let i = 0; i < text.length; i++) {
        const c = text.charAt(i);
        if (/[A-Za-z\u4e00-\u9fff]/.test(c)) {
            ch = c;
            break;
        }
    }

    if (/[A-Za-z]/.test(ch)) {
        return ch.toUpperCase();
    }

    if (CHAR_LETTER_MAP[ch]) {
        return CHAR_LETTER_MAP[ch];
    }

    return '#';
}

/** 侧边索引 / scroll-into-view id */
export function getSectionId(name) {
    if (name === '推荐' || name === '推') return 'tui';
    if (name === '#') return 'hash';
    return String(name || '');
}

/**
 * 高亮匹配：将 keyword 在 text 中的片段拆成 nodes
 * @returns {{text:string, light:boolean}[]}
 */
export function buildHighlightNodes(text = '', keyword = '') {
    const source = String(text || '');
    const key = String(keyword || '').trim();
    if (!key) {
        return [{text: source, light: false}];
    }

    const lowerSource = source.toLowerCase();
    const lowerKey = key.toLowerCase();
    const nodes = [];
    let start = 0;
    let idx = lowerSource.indexOf(lowerKey);

    while (idx !== -1) {
        if (idx > start) {
            nodes.push({text: source.slice(start, idx), light: false});
        }
        nodes.push({text: source.slice(idx, idx + key.length), light: true});
        start = idx + key.length;
        idx = lowerSource.indexOf(lowerKey, start);
    }

    if (start < source.length) {
        nodes.push({text: source.slice(start), light: false});
    }

    return nodes.length ? nodes : [{text: source, light: false}];
}

/**
 * 将平铺联系人按首字母分组
 * @param {Array} contacts
 * @returns {{name:string, value:Array, personSource:string, className?:string}[]}
 */
export function groupContactsByLetter(contacts = []) {
    if (!contacts || !contacts.length) return [];

    const groupMap = {};
    const order = [];

    contacts.forEach((item) => {
        const name = item.displayName || item.name || '';
        const letter = getFirstLetterInMap(name, item.letter || item.index);
        if (!groupMap[letter]) {
            groupMap[letter] = [];
            order.push(letter);
        }
        groupMap[letter].push(item);
    });

    order.sort((a, b) => (AlphabetMap[a] || 99) - (AlphabetMap[b] || 99));

    const list = order.map((letter) => ({
        name: letter,
        value: groupMap[letter],
        personSource: 'all',
        sectionId: getSectionId(letter),
    }));

    list.unshift({
        name: '全部联系人',
        value: [],
        className: 'first-level',
        personSource: 'all',
        sectionId: 'all',
    });

    return list;
}

/**
 * 组装推荐区
 */
export function buildRecommendSection(recommendList = [], title = '推荐') {
    if (!recommendList || !recommendList.length) return [];
    return [{
        name: title,
        value: recommendList.map((item) => ({
            ...item,
            tag: item.tag || item.recommendTypeDesc || '',
        })),
        className: 'first-level',
        personSource: 'recommend',
        sectionId: getSectionId(title),
    }];
}

/**
 * 合并推荐 + 全部联系人，按 userId 去重
 */
export function flattenContacts(recommendList = [], contactList = []) {
    const seen = {};
    const result = [];
    [].concat(recommendList || []).concat(contactList || []).forEach((item) => {
        if (!item) return;
        const key = String(item.userId || item.id || `${item.displayName || item.name || ''}_${item.loginId || ''}`);
        if (seen[key]) return;
        seen[key] = true;
        result.push(item);
    });
    return result;
}

/**
 * 本地搜索；keyword 为空时返回全部
 */
export function filterContacts(contacts = [], keyword = '') {
    const key = String(keyword || '').trim().toLowerCase();
    const source = !key
        ? contacts
        : contacts.filter((item) => {
            const name = String(item.displayName || item.name || '').toLowerCase();
            const loginId = String(item.loginId || item.desc || '').toLowerCase();
            const userId = String(item.userId || item.id || '').toLowerCase();
            return name.indexOf(key) !== -1
                || loginId.indexOf(key) !== -1
                || userId.indexOf(key) !== -1;
        });

    return source.map((item) => {
        const displayName = item.displayName || item.name || '';
        return {
            ...item,
            displayName,
            nodes: key ? buildHighlightNodes(displayName, keyword) : [{text: displayName, light: false}],
            tag: item.tag || item.recommendTypeDesc || '',
        };
    });
}
