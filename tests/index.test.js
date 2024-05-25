"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
test('greet function', () => {
    expect((0, index_1.greet)('Tester')).toBe('Hello, Tester!');
});
