#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.CORE_D_TITLE = 'prettier_d_slim';
process.env.CORE_D_DOTFILE = '.prettier_d_slim';
process.env.CORE_D_SERVICE = require.resolve('../linter');
const core_d_1 = __importDefault(require("core_d"));
function main() {
    const cmd = process.argv[2];
    if (cmd === 'start' ||
        cmd === 'stop' ||
        cmd === 'restart' ||
        cmd === 'status') {
        core_d_1.default[cmd]();
        return;
    }
    const args = process.argv.slice(2);
    if (args.indexOf('--stdin') > -1) {
        let text = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => {
            text += chunk;
        });
        process.stdin.on('end', () => {
            core_d_1.default.invoke(args, text);
        });
        return;
    }
    core_d_1.default.invoke(args);
}
main();
