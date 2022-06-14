import LRU from 'nanolru';
import type { Options } from 'prettier';
export interface CacheInstance {
    hasConfig: boolean;
    ignorePath: string;
    options: Options;
    prettier: typeof import('prettier');
    lastRun?: number;
}
export declare type ParsedOptions = Options & {
    stdin?: boolean;
    stdinFilepath?: string;
    text?: string;
    pluginSearchDir?: string;
    plugin?: string;
    configPrecedence?: string;
};
declare module 'prettier' {
    interface FileInfoOptions {
        pluginSearchDirs?: string[];
    }
}
export declare const invoke: (cwd: string, args: string[], text: string, mtime: number, callback: (err: unknown, response: string) => void) => void;
export declare const cache: LRU<CacheInstance>;
export declare const getStatus: () => string;
