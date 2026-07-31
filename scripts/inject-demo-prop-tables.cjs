/**
 * 从各组件 properties 提取属性说明，并注入到对应 Demo 页面。
 * 用法: node scripts/inject-demo-prop-tables.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEMO_ROOT = path.join(ROOT, 'src/pages/demo/components');
const COMP_ROOT = path.join(ROOT, 'src/components/mxwui');

const SKIP_DEMOS = new Set(['components', '1-template']);

function toKebab(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}

function typeName(typeExpr) {
    const t = String(typeExpr || '').trim();
    if (t === 'String') return 'String';
    if (t === 'Number') return 'Number';
    if (t === 'Boolean') return 'Boolean';
    if (t === 'Array') return 'Array';
    if (t === 'Object') return 'Object';
    if (t === 'null') return 'Any';
    return t || 'Any';
}

/** 从 `value:` 后解析一个 JS 字面量/标识符 */
function parseValueLiteral(src, startIdx) {
    let i = startIdx;
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) return {raw: '', end: i};

    const ch = src[i];
    // 字符串
    if (ch === "'" || ch === '"' || ch === '`') {
        const quote = ch;
        let j = i + 1;
        let escaped = false;
        for (; j < src.length; j++) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (src[j] === '\\') {
                escaped = true;
                continue;
            }
            if (src[j] === quote) {
                j++;
                break;
            }
        }
        return {raw: src.slice(i, j), end: j};
    }

    // 数组 / 对象
    if (ch === '[' || ch === '{') {
        const open = ch;
        const close = ch === '[' ? ']' : '}';
        let depth = 0;
        let j = i;
        let inStr = null;
        let escaped = false;
        for (; j < src.length; j++) {
            const c = src[j];
            if (inStr) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (c === '\\') {
                    escaped = true;
                    continue;
                }
                if (c === inStr) inStr = null;
                continue;
            }
            if (c === "'" || c === '"' || c === '`') {
                inStr = c;
                continue;
            }
            if (c === open) depth++;
            else if (c === close) {
                depth--;
                if (depth === 0) {
                    j++;
                    break;
                }
            }
        }
        return {raw: src.slice(i, j), end: j};
    }

    // 标识符 / 数字 / 布尔 / null / 带点常量
    let j = i;
    while (j < src.length && /[A-Za-z0-9_.$+-]/.test(src[j])) j++;
    // 函数调用 DEFAULT_X()
    if (src[j] === '(') {
        let depth = 0;
        for (; j < src.length; j++) {
            if (src[j] === '(') depth++;
            else if (src[j] === ')') {
                depth--;
                if (depth === 0) {
                    j++;
                    break;
                }
            }
        }
    }
    return {raw: src.slice(i, j), end: j};
}

function extractDefaultFromBlock(block) {
    // 跳过属性名行的 `value: {`，只在配置对象内部找默认值
    const open = block.indexOf('{');
    if (open < 0) return '';
    const inner = block.slice(open + 1);
    const m = inner.match(/(?:^|[,{\s])value\s*:/);
    if (!m) return '';
    // 定位到匹配中的 value:
    const abs = open + 1 + m.index + m[0].indexOf('value');
    const afterKey = block.indexOf(':', abs) + 1;
    return parseValueLiteral(block, afterKey).raw.trim();
}

function formatDefault(raw) {
    if (raw == null) return '';
    let v = String(raw).trim();
    if (!v) return '';
    if (v === '[]') return '空数组';
    if (v === '{}') return '空对象';
    if (v === 'null') return 'null';
    if (v === 'true' || v === 'false') return v;
    if (/^[A-Z_][A-Z0-9_.]*$/.test(v)) return v;
    if (/^[A-Za-z_$][\w$]*\(/.test(v)) return v;
    if (v.startsWith('[') || v.startsWith('{')) {
        const compact = v.replace(/\s+/g, ' ');
        if (compact.length > 36) return compact.slice(0, 33) + '...';
        // 展示用全角括号，避免与结构符号混淆
        return compact.replace(/\[/g, '［').replace(/\]/g, '］').replace(/\{/g, '｛').replace(/\}/g, '｝');
    }
    return v.replace(/^['"]|['"]$/g, '');
}

function extractValues(comment, type, defaultVal) {
    const c = comment || '';

    if (type === 'Boolean') return 'true / false';

    let m = c.match(/可选值\s*[:：]?\s*([^\n，。；]+)/);
    if (m) {
        return m[1]
            .replace(/\|/g, ' / ')
            .replace(/\s*\/\s*/g, ' / ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const afterColon = c.split(/[:：]/).slice(1).join('：').trim();
    const enumSource = afterColon || c;
    const enumParts = [];
    const enumRe = /([A-Za-z][\w.-]*)(?:\s*[\u4e00-\u9fff（）()，,、-]*)?(?:\s*\/\s*|\s*\|\s*)/g;
    const temp = enumSource + ' /';
    let em;
    while ((em = enumRe.exec(temp)) !== null) {
        enumParts.push(em[1]);
        if (enumParts.length > 12) break;
    }
    const uniq = [...new Set(enumParts)];
    if (uniq.length >= 2) {
        return uniq.join(' / ');
    }

    m = c.match(/([A-Za-z][\w]*(?:\|[A-Za-z][\w]*){2,})/);
    if (m) {
        return m[1].replace(/\|/g, ' / ');
    }

    const d = formatDefault(defaultVal);
    if (d !== '') return `默认 ${d}`;
    return '-';
}

function isRequired(comment) {
    const c = comment || '';
    if (/(?:^|[^\u4e00-\u9fff])必填(?:[^\u4e00-\u9fff]|$)|必传/.test(c) || /（必填）|\(必填\)/.test(c)) {
        return '必填';
    }
    return '选填';
}

function extractPropertiesBlock(fileContent) {
    const propsStart = fileContent.search(/properties\s*:\s*\{/);
    if (propsStart < 0) return '';
    const braceStart = fileContent.indexOf('{', propsStart);
    let depth = 0;
    for (let i = braceStart; i < fileContent.length; i++) {
        const ch = fileContent[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return fileContent.slice(braceStart + 1, i);
        }
    }
    return '';
}

function parsePropertiesFromBody(body) {
    if (!body) return [];
    const lines = body.split('\n');
    const result = [];
    let pendingComment = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const commentMatch = line.match(/^\s*\/\/\s*(.*)$/);
        if (commentMatch) {
            pendingComment = (pendingComment ? pendingComment + ' ' : '') + commentMatch[1].trim();
            continue;
        }

        const nameMatch = line.match(/^\s*([A-Za-z_][\w]*)\s*:\s*\{/);
        if (!nameMatch) continue;

        const propName = nameMatch[1];
        let block = line;
        let d = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        let j = i;
        while (d > 0 && j + 1 < lines.length) {
            j++;
            block += '\n' + lines[j];
            d += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
        }
        i = j;

        const typeMatch = block.match(/type\s*:\s*([A-Za-znull]+)/);
        const type = typeName(typeMatch ? typeMatch[1] : 'null');
        const defaultRaw = extractDefaultFromBlock(block);
        const comment = pendingComment;
        pendingComment = '';

        result.push({
            prop: propName,
            values: extractValues(comment, type, defaultRaw),
            required: isRequired(comment),
            type,
        });
    }

    return result;
}

function resolveBehaviorFiles(compJsPath, fileContent) {
    const files = [];
    // import xxx from '../behaviors/dialog'
    const importRe = /import\s+(\w+)\s+from\s+['"]([^'"]*behaviors[^'"]*)['"]/g;
    let m;
    const importMap = {};
    while ((m = importRe.exec(fileContent))) {
        importMap[m[1]] = m[2];
    }

    // behaviors: [createDialogBehavior('popup_close'), selectBehavior]
    const behMatch = fileContent.match(/behaviors\s*:\s*\[([\s\S]*?)\]/);
    if (!behMatch) return files;
    const items = behMatch[1].split(',').map((s) => s.trim()).filter(Boolean);

    for (const item of items) {
        const name = item.replace(/\(.*$/, '').trim();
        const rel = importMap[name];
        if (!rel) continue;
        let abs = path.resolve(path.dirname(compJsPath), rel);
        if (!abs.endsWith('.js')) abs += '.js';
        if (fs.existsSync(abs)) files.push(abs);
    }
    return files;
}

function parseProperties(compJsPath, fileContent) {
    const seen = new Set();
    const result = [];

    // behavior 属性在前（通用能力），组件自身属性在后
    for (const behFile of resolveBehaviorFiles(compJsPath, fileContent)) {
        const behContent = fs.readFileSync(behFile, 'utf8');
        for (const p of parsePropertiesFromBody(extractPropertiesBlock(behContent))) {
            if (seen.has(p.prop)) continue;
            seen.add(p.prop);
            result.push(p);
        }
    }

    for (const p of parsePropertiesFromBody(extractPropertiesBlock(fileContent))) {
        if (seen.has(p.prop)) continue;
        seen.add(p.prop);
        result.push(p);
    }

    return result;
}

function serializePropDocs(docs) {
    if (!docs.length) return '[]';
    const rows = docs.map((d) => {
        const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `            {prop: '${esc(d.prop)}', values: '${esc(d.values)}', required: '${esc(d.required)}', type: '${esc(d.type)}'}`;
    });
    return `[\n${rows.join(',\n')}\n        ]`;
}

/** 从 data 中移除已有 propDocs 字段（按括号匹配，避免 values 中的字符干扰） */
function stripPropDocs(js) {
    const marker = js.match(/propDocs\s*:\s*/);
    if (!marker) return js;
    const start = marker.index;
    let i = start + marker[0].length;
    while (i < js.length && /\s/.test(js[i])) i++;
    if (js[i] !== '[') {
        // 非数组，尽量删到下一个逗号/换行
        const end = js.indexOf(',', i);
        if (end < 0) return js;
        return js.slice(0, start) + js.slice(end + 1);
    }
    let depth = 0;
    let inStr = null;
    let escaped = false;
    for (; i < js.length; i++) {
        const ch = js[i];
        if (inStr) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === inStr) inStr = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            inStr = ch;
            continue;
        }
        if (ch === '[') depth++;
        else if (ch === ']') {
            depth--;
            if (depth === 0) {
                i++;
                break;
            }
        }
    }
    // 吃掉尾随逗号与紧随的空白（保留一个换行结构）
    let end = i;
    if (js[end] === ',') end++;
    while (end < js.length && (js[end] === ' ' || js[end] === '\t')) end++;
    if (js[end] === '\n') end++;
    return js.slice(0, start) + js.slice(end);
}

function ensureJsonHasPropTable(jsonPath) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    let json;
    try {
        json = JSON.parse(raw);
    } catch (e) {
        console.warn('skip invalid json', jsonPath);
        return false;
    }
    json.usingComponents = json.usingComponents || {};
    if (!json.usingComponents['prop-table']) {
        json.usingComponents['prop-table'] = '../components/demoPropTable/index';
        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
        return true;
    }
    return false;
}

function ensureWxmlHasPropTable(wxmlPath) {
    let wxml = fs.readFileSync(wxmlPath, 'utf8');
    if (wxml.includes('<prop-table')) {
        return false;
    }

    const block = `
    <wrap>
        <title type="h2">属性说明</title>
        <desc>组件支持的属性一览</desc>
        <prop-table dataSource="{{propDocs}}" />
    </wrap>
`;

    const lastClose = wxml.lastIndexOf('</view>');
    if (lastClose >= 0) {
        wxml = wxml.slice(0, lastClose) + block + wxml.slice(lastClose);
        fs.writeFileSync(wxmlPath, wxml);
        return true;
    }

    wxml = wxml.trimEnd() + '\n' + block + '\n';
    fs.writeFileSync(wxmlPath, wxml);
    return true;
}

function ensureJsHasPropDocs(jsPath, docs) {
    let js = fs.readFileSync(jsPath, 'utf8');
    js = stripPropDocs(js);
    // 清理 data 开头残留空行
    js = js.replace(/(data\s*:\s*\{\n)(?:[ \t]*\n)+/g, '$1');

    const serialized = serializePropDocs(docs);
    const dataMatch = js.match(/data\s*:\s*\{/);
    if (!dataMatch) {
        console.warn('no data block', jsPath);
        return false;
    }
    const idx = dataMatch.index + dataMatch[0].length;
    const inject = `\n        propDocs: ${serialized},`;
    js = js.slice(0, idx) + inject + js.slice(idx);
    fs.writeFileSync(jsPath, js);
    return true;
}

function main() {
    const demos = fs
        .readdirSync(DEMO_ROOT)
        .filter((d) => !SKIP_DEMOS.has(d) && fs.statSync(path.join(DEMO_ROOT, d)).isDirectory())
        .sort();

    let ok = 0;
    let fail = 0;

    for (const demo of demos) {
        const kebab = toKebab(demo);
        const compJs = path.join(COMP_ROOT, kebab, 'index.js');
        const demoJs = path.join(DEMO_ROOT, demo, 'index.js');
        const demoJson = path.join(DEMO_ROOT, demo, 'index.json');
        const demoWxml = path.join(DEMO_ROOT, demo, 'index.wxml');

        if (!fs.existsSync(compJs)) {
            console.warn(`[skip] no component for ${demo} (${kebab})`);
            fail++;
            continue;
        }
        if (!fs.existsSync(demoJs) || !fs.existsSync(demoJson) || !fs.existsSync(demoWxml)) {
            console.warn(`[skip] incomplete demo ${demo}`);
            fail++;
            continue;
        }

        const docs = parseProperties(compJs, fs.readFileSync(compJs, 'utf8'));
        ensureJsonHasPropTable(demoJson);
        ensureWxmlHasPropTable(demoWxml);
        const jsOk = ensureJsHasPropDocs(demoJs, docs);
        if (!jsOk) {
            console.warn(`[warn] js inject failed ${demo}`);
            fail++;
        } else {
            ok++;
            console.log(`[ok] ${demo} (${docs.length} props)`);
        }
    }

    const tplWxml = path.join(DEMO_ROOT, '1-template', 'index.wxml');
    const tplJs = path.join(DEMO_ROOT, '1-template', 'index.js');
    const tplJson = path.join(DEMO_ROOT, '1-template', 'index.json');
    if (fs.existsSync(tplJson)) {
        ensureJsonHasPropTable(tplJson);
        ensureWxmlHasPropTable(tplWxml);
        if (fs.existsSync(tplJs)) {
            ensureJsHasPropDocs(tplJs, [
                {prop: 'propName', values: '可选值示例', required: '选填', type: 'String'},
            ]);
        }
    }

    console.log(`\nDone. success=${ok}, failed=${fail}, total=${demos.length}`);
}

main();
