import { greet } from '../src/index';

test('greet function', () => {
  expect(greet('Tester')).toBe('Hello, Tester!');
});
