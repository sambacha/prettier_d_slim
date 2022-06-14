"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.cache = exports.invoke = void 0;
const path_1 = __importDefault(require("path"));
const camelize_1 = __importDefault(require("camelize"));
const minimist_1 = __importDefault(require("minimist"));
const nanolru_1 = __importDefault(require("nanolru"));
const resolve_1 = __importDefault(require("resolve"));
const prettierCache = new nanolru_1.default(10);
function createCache(cwd, filePath = cwd) {
    let prettierPath;
    try {
        prettierPath = resolve_1.default.sync('prettier', { basedir: cwd });
    }
    catch (e) {
        prettierPath = resolve_1.default.sync('prettier');
    }
    const prettier = require(prettierPath);
    const configPath = prettier.resolveConfigFile.sync(filePath);
    const ignorePath = path_1.default.join(cwd, '.prettierignore');
    const options = prettier.resolveConfig.sync(filePath, {
        useCache: false,
        editorconfig: true,
    }) ?? {};
    const cacheInstance = {
        prettier,
        options,
        ignorePath,
        hasConfig: Boolean(configPath),
    };
    return prettierCache.set(cwd, cacheInstance);
}
function clearRequireCache(cwd) {
    Object.keys(require.cache)
        .filter((key) => key.startsWith(cwd))
        .forEach((key) => {
        delete require.cache[key];
    });
}
function validateNoCliOptions(options) {
    return Object.entries(options).reduce((acc, [key, val]) => {
        if (key.startsWith('no-')) {
            if (val === true) {
                acc[key.replace(/^no-/, '')] = false;
            }
        }
        else {
            acc[key] = val;
        }
        return acc;
    }, {});
}
function parseArguments(args) {
    const rawOptions = (0, minimist_1.default)(args, {
        boolean: [
            'config',
            'editorconfig',
            'insert-pragma',
            'jsx-bracket-same-line',
            'jsx-single-quote',
            'no-bracket-spacing',
            'no-semi',
            'require-pragma',
            'single-quote',
            'use-tabs',
            'vue-indent-script-and-style',
            'color',
            'stdin',
        ],
    });
    const parsedOptions = (0, camelize_1.default)(validateNoCliOptions(rawOptions));
    if (parsedOptions.stdinFilepath) {
        parsedOptions.filepath = parsedOptions.stdinFilepath;
    }
    if (parsedOptions.configPrecedence == null) {
        parsedOptions.configPrecedence = 'file-override';
    }
    return parsedOptions;
}
const invoke = (cwd, args, text, mtime, callback) => {
    const parsedOptions = parseArguments(args);
    process.chdir(cwd);
    let cache = prettierCache.get(cwd);
    if (!cache) {
        cache = createCache(cwd, parsedOptions.filepath);
    }
    else if (mtime > (cache.lastRun || 0)) {
        clearRequireCache(cwd);
        cache = createCache(cwd, parsedOptions.filepath);
    }
    cache.lastRun = Date.now();
    if (!cache.hasConfig) {
        callback(null, text);
        return;
    }
    const filePath = parsedOptions.filepath;
    if (!filePath) {
        throw new Error('set filePath with `--stdin-filepath`');
    }
    const fileInfo = cache.prettier.getFileInfo.sync(filePath, {
        ignorePath: cache.ignorePath,
        pluginSearchDirs: parsedOptions.pluginSearchDir
            ? parsedOptions.pluginSearchDir.split(':')
            : undefined,
        plugins: parsedOptions.plugin ? parsedOptions.plugin.split(':') : undefined,
    });
    if (fileInfo.ignored) {
        callback(null, text);
        return;
    }
    let options = {};
    switch (parsedOptions.configPrecedence) {
        case 'cli-override':
            options = Object.assign({}, cache.options, parsedOptions);
            break;
        case 'file-override':
            options = Object.assign({}, parsedOptions, cache.options);
            break;
    }
    if (parsedOptions.stdin && parsedOptions.filepath) {
        options.filepath = parsedOptions.filepath;
    }
    callback(null, cache.prettier.format(parsedOptions.text ?? text, options));
};
exports.invoke = invoke;
exports.cache = prettierCache;
const getStatus = () => {
    const { keys } = prettierCache;
    if (keys.length === 0) {
        return 'No instances cached.';
    }
    if (keys.length === 1) {
        return 'One instance cached.';
    }
    return `${keys.length} instances cached.`;
};
exports.getStatus = getStatus;
