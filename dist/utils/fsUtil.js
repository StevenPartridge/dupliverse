"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FSUtil {
    static ensureDirectoryExists(directoryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.default.promises.mkdir(directoryPath, { recursive: true });
        });
    }
    static fileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.default.promises.access(filePath);
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    static getFilesRecursively(directory) {
        return __asyncGenerator(this, arguments, function* getFilesRecursively_1() {
            const dirEntries = yield __await(fs_1.default.promises.readdir(directory, {
                withFileTypes: true,
            }));
            for (const dirEntry of dirEntries) {
                const res = path_1.default.resolve(directory, dirEntry.name);
                if (dirEntry.isDirectory()) {
                    yield __await(yield* __asyncDelegator(__asyncValues(FSUtil.getFilesRecursively(res))));
                }
                else {
                    yield yield __await(res);
                }
            }
        });
    }
    static countFiles(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            let count = 0;
            try {
                for (var _d = true, _e = __asyncValues(FSUtil.getFilesRecursively(directory)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const _ = _c;
                    count++;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return count;
        });
    }
    static countFilesByExtensions(directory, extensions) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            let count = 0;
            const extensionsSet = new Set(extensions.map((ext) => ext.toLowerCase()));
            try {
                for (var _d = true, _e = __asyncValues(FSUtil.getFilesRecursively(directory)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const filePath = _c;
                    // slice(1) here assumes the extension starts with a dot
                    if (extensionsSet.has(path_1.default.extname(filePath).toLowerCase().slice(1))) {
                        count++;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return count;
        });
    }
}
exports.default = FSUtil;
