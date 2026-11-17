import pkg from "gulp";
const { src, dest, series, parallel, watch } = pkg;
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execa } from "execa";
import { deleteAsync, deleteSync } from "del";
import through2 from "through2";
import alias from "gulp-wechat-weapp-src-alisa";
import autoprefixer from "gulp-autoprefixer";
import babel from "gulp-babel";
import base64 from "gulp-base64";
import changed from "gulp-changed";
import gulpIf from "gulp-if";
import jsonminify from "gulp-jsonminify";
import less from "gulp-less";
import notifier from "gulp-notify";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import cleancss from "gulp-clean-css";
import terser from "gulp-terser";
import replace from "gulp-replace";

const isProduction = (process.env.NODE_ENV || "dev") !== "dev";

const DIST = isProduction ? "./dist" : "./dist_dev";

// 开发者工具路径
const wechatToolPath = "/Applications/wechatwebdevtools.app";
const wxcli = `${wechatToolPath}/Contents/MacOS/cli`;

// 从 theme.js 生成 Less 颜色变量（单一数据源）
function genColorsLess(cb) {
    const themePath = path.resolve("src/components/mxwui/utils/theme.js");
    const outPath = path.resolve("src/common/colors.less");
    const content = fs.readFileSync(themePath, "utf8");
    const body = content.match(/export const COLOR = \{([\s\S]*?)\};/);
    if (!body) {
        cb(new Error("COLOR not found in theme.js"));
        return;
    }
    const entries = [...body[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g)];
    if (!entries.length) {
        cb(new Error("No color entries found in theme.js"));
        return;
    }
    const less = [
        "// Auto-generated from components/mxwui/utils/theme.js — do not edit",
        ...entries.map(([, key, val]) => `@${key}: ${val};`),
        "",
    ].join("\n");
    fs.writeFileSync(outPath, less);
    cb();
}

// 源文件目录（排除组件库内模板/废弃目录）
const discardGlobs = [
    "!**/mxwui/1-template/**",
    "!**/mxwui/2-discard/**",
];
const filePath = {
    jsPath: [
        "src/**/*.js",
        "!src/config/*.js",
        "!src/components/mxwui/1-template/**/*.js",
        "!src/components/mxwui/2-discard/**/*.js",
    ],
    wxmlPath: [
        "src/**/*.xml",
        "src/**/*.wxml",
        "!src/components/mxwui/1-template/**/*",
        "!src/components/mxwui/2-discard/**/*",
    ],
    cssPath: [
        "src/**/*.less",
        "src/**/*.wxss",
        "!src/components/mxwui/1-template/**/*",
        "!src/components/mxwui/2-discard/**/*",
    ],
    jsonPath: [
        "src/**/*.json",
        "!src/components/mxwui/1-template/**/*",
        "!src/components/mxwui/2-discard/**/*",
    ],
    wxsPath: [
        "src/**/*.wxs",
        "!src/components/mxwui/1-template/**/*",
        "!src/components/mxwui/2-discard/**/*",
    ],
    configPath: isProduction
        ? "src/config/config.js"
        : "src/config/config.dev.js",
    projectJsonPath: isProduction
        ? fs.existsSync("online.config.json")
            ? "online.config.json"
            : "project.config.json"
        : fs.existsSync("dev.config.json")
        ? "dev.config.json"
        : "project.config.dev.json",
};

// 错误提示
function onError(err) {
    notifier.onError({
        title: "Gulp",
        subtitle: "Failure!",
        message: "Error: <%= error.message %>",
        timeout: 5,
        sound: "Beep",
    })(err);
}

// 路径拼接
function _join(dirname) {
    return path.join(process.cwd(), "src", dirname);
}

// 引用路径别名配置
const aliasConfig = {
    "@config": _join("config"),
    "@utils": _join("utils"),
    "@components": _join("components"),
    "@modules": _join("modules"),
    "@common": _join("common"),
};

const miniWxml = function () {
    return through2.obj((file, enc, next) => {
        if (file.isNull()) {
            next(null, file);
            return;
        }
        const context = file.contents
            .toString()
            .replace(/\n\s*/gm, " ") // 移除换行
            .replace(/>\s+</g, "><") // 标签间的空格
            .replace(/<\/([-a-zA-Z]+)\s+>/g, "</$1>") // 移除行标签内空格
            .replace(/<!--(.*?)-->/g, ""); // 移除注释
        file.contents = Buffer.from(context);
        next(null, file);
    });
};

// xml编译
function wxml() {
    return src(filePath.wxmlPath)
        .pipe(miniWxml())
        .pipe(changed(DIST, { extension: ".wxml" }))
        .pipe(rename({ extname: ".wxml" }))
        .pipe(dest(DIST));
}

// less编译
function wxss() {
    return (
        src(filePath.cssPath, { base: "src/" })
            .pipe(changed(DIST, { extension: ".wxss" }))
            // .pipe(gulpIf(!isProduction, sourcemaps.init()))
            .pipe(
                alias({
                    "@common": aliasConfig["@common"],
                })
            )
            .pipe(
                base64({
                    extensions: ["svg", "png", "jpg"],
                    maxImageSize: 1024 * 1024 * 1024 * 1024,
                    exclude: [/^(http|https)/],
                })
            )
            .pipe(less())
            .pipe(autoprefixer())
            .pipe(cleancss({ compatibility: "ie9" }))
            .pipe(plumber(onError))
            // .pipe(gulpIf(!isProduction, sourcemaps.write()))
            .pipe(rename({ extname: ".wxss" }))
            .pipe(dest(DIST))
    );
}

// production 下压缩 JS（保留小程序 ES module 语法）
function minifyJs() {
    return terser({
        compress: true,
        mangle: true,
        format: {
            comments: false,
        },
    });
}

// config编译
function config() {
    return src(filePath.configPath, { base: "src/", allowEmpty: true })
        .pipe(plumber(onError))
        .pipe(gulpIf(!isProduction, sourcemaps.init()))
        .pipe(rename({ basename: "config" }))
        .pipe(changed(DIST))
        .pipe(babel())
        .pipe(gulpIf(isProduction, minifyJs()))
        .pipe(dest(DIST));
}

// js编译
function js() {
    return src(filePath.jsPath, { allowEmpty: true })
        .pipe(
            alias({
                "@utils": aliasConfig["@utils"],
                "@components": aliasConfig["@components"],
            })
        )
        .pipe(plumber(onError))
        .pipe(changed(DIST))
        .pipe(babel())
        .pipe(gulpIf(isProduction, minifyJs()))
        .pipe(gulpIf(!isProduction, sourcemaps.write()))
        .pipe(dest(DIST));
}

// 判断 condition 是否包含有效编译模式
function hasCompileModes(condition) {
    if (!condition || typeof condition !== "object") return false;
    return Object.keys(condition).some((key) => {
        const val = condition[key];
        if (Array.isArray(val) && val.length) return true;
        if (val && typeof val === "object" && Array.isArray(val.list) && val.list.length) {
            return true;
        }
        return false;
    });
}

// 写入 project.config.json 时保留已有编译模式，避免被空 condition 覆盖
function preserveProjectCondition() {
    return through2.obj((file, enc, next) => {
        if (!/project\.config\.json$/.test(file.path)) {
            next(null, file);
            return;
        }
        const destPath = path.resolve(DIST, "project.config.json");
        if (!fs.existsSync(destPath)) {
            next(null, file);
            return;
        }
        try {
            const existing = JSON.parse(fs.readFileSync(destPath, "utf8"));
            const incoming = JSON.parse(file.contents.toString());
            if (hasCompileModes(existing.condition) && !hasCompileModes(incoming.condition)) {
                incoming.condition = existing.condition;
                file.contents = Buffer.from(`${JSON.stringify(incoming, null, 2)}\n`);
            }
        } catch {
            // ignore parse errors, keep original file
        }
        next(null, file);
    });
}

// json编译
function json() {
    return src(filePath.projectJsonPath, { allowEmpty: true })
        .pipe(rename({ basename: "project.config" }))
        .pipe(preserveProjectCondition())
        .pipe(src(filePath.jsonPath))
        .pipe(
            alias({
                "@components": aliasConfig["@components"],
                "@utils": aliasConfig["@utils"],
            })
        )
        .pipe(changed(DIST))
        .pipe(
            gulpIf((file) => {
                return !/project\.config/g.test(String(file.path));
            }, jsonminify())
        )
        .pipe(dest(DIST));
}

// wxs编译
function wxs() {
    return src(filePath.wxsPath)
        .pipe(plumber(onError))
        .pipe(changed(DIST))
        .pipe(babel())
        .pipe(gulpIf(isProduction, minifyJs()))
        .pipe(rename({ extname: ".wxs" }))
        .pipe(dest(DIST));
}

// 编译前暂存：微信开发者工具的编译模式等个人配置
let preservedPrivateConfig = null;
let preservedCondition = null;

// 清除编译结果目录（保留开发者工具个人配置，避免编译模式被清掉）
async function clean() {
    const privateConfigPath = path.resolve(DIST, "project.private.config.json");
    const projectConfigPath = path.resolve(DIST, "project.config.json");

    preservedPrivateConfig = null;
    preservedCondition = null;

    if (fs.existsSync(privateConfigPath)) {
        preservedPrivateConfig = fs.readFileSync(privateConfigPath);
    }
    if (fs.existsSync(projectConfigPath)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(projectConfigPath, "utf8"));
            if (hasCompileModes(cfg.condition)) {
                preservedCondition = cfg.condition;
            }
        } catch {
            // ignore
        }
    }

    await deleteAsync([DIST]);
}

// 清理后恢复开发者工具个人配置与编译模式
function restorePreservedConfig(cb) {
    if (preservedPrivateConfig) {
        fs.mkdirSync(DIST, { recursive: true });
        fs.writeFileSync(
            path.resolve(DIST, "project.private.config.json"),
            preservedPrivateConfig
        );
    }
    if (preservedCondition) {
        const projectConfigPath = path.resolve(DIST, "project.config.json");
        if (fs.existsSync(projectConfigPath)) {
            try {
                const cfg = JSON.parse(fs.readFileSync(projectConfigPath, "utf8"));
                if (!hasCompileModes(cfg.condition)) {
                    cfg.condition = preservedCondition;
                    fs.writeFileSync(
                        projectConfigPath,
                        `${JSON.stringify(cfg, null, 2)}\n`
                    );
                }
            } catch {
                // ignore
            }
        }
    }
    preservedPrivateConfig = null;
    preservedCondition = null;
    cb();
}

// 打开开发者工具
function openTool() {
    return execa(wxcli, ["-o", path.resolve(DIST)], {
        stdio: "inherit",
    });
}

// 监听任务
function watcher(callback) {
    const addOrChange = { events: ["add", "change"] };
    watch(filePath.wxmlPath, addOrChange, wxml);
    watch(
        "src/components/mxwui/utils/theme.js",
        addOrChange,
        series(genColorsLess, wxss)
    );
    watch(filePath.cssPath, addOrChange, wxss);
    watch(filePath.jsPath, addOrChange, js);
    watch(filePath.jsonPath, addOrChange, json);
    watch(filePath.wxsPath, addOrChange, wxs);

    const srcPath = "src/**";

    // 将 src 路径映射到编译产物路径（含扩展名转换）
    function toDistPath(srcFilePath) {
        const normalized = String(srcFilePath).replace(/\\/g, "/");
        let rel = normalized.replace(/^(\.\/)?src\//, "");
        rel = rel
            .replace(/\.less$/i, ".wxss")
            .replace(/\.xml$/i, ".wxml");
        if (
            rel === "config/config.dev.js" ||
            rel === "config/config.js"
        ) {
            rel = "config/config.js";
        }
        return path.join(DIST, rel);
    }

    function safeDelete(targets, label) {
        try {
            deleteSync(targets, { force: true });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log(chalk.red(`${label}失败：${err.message}`));
        }
    }

    // 同步删除编译产物；捕获异常，避免中断 watch
    watch(srcPath).on("unlink", function delFile(filePath) {
        const destPath = toDistPath(filePath);
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`删除文件：${filePath} → ${destPath}`));
        safeDelete([destPath], "删除文件");
    });

    watch(srcPath).on("unlinkDir", function delFile(dirPath) {
        const destPath = toDistPath(dirPath);
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`删除文件夹：${dirPath} → ${destPath}`));
        safeDelete([destPath], "删除文件夹");
    });

    const projectConfigJson = `${DIST}/project.config.json`;

    // 监听开发者工具修改project.config.json
    watch(projectConfigJson, function syncProjectConfig() {
        const projectConfig = isProduction ? "online.config" : "dev.config";
        return src(projectConfigJson)
            .pipe(
                rename({
                    basename: projectConfig,
                })
            )
            .pipe(dest("./"));
    });

    callback();
}

// 代码编译
const buildTasks = series(
    genColorsLess,
    parallel(config, js, json, wxml, wxss, wxs)
);

// 再次编译（如果开发者工具已经打开，并且不需要清除编译结果，可用此命令，速度极快）
// const watchs = series(buildTasks, openTool, watcher);
const watchs = series(buildTasks, watcher);
export { watchs as watch };

// 默认任务 (清理 + 编译 + 恢复开发者工具配置)
const defaultTask = series(clean, buildTasks, restorePreservedConfig);
export default defaultTask;
