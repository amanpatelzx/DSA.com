import { judgeRun } from '../apps/api/src/services/judgeService.js';

async function testCustom() {
  const customMeta = {
    name: 'customMultiply',
    params: [{ name: 'a', type: 'integer' }, { name: 'b', type: 'integer' }],
    return: { type: 'integer' }
  };

  const testcases = [
    { input: 'a = 6, b = 7', expected: '42' },
    { input: 'a = 12, b = 11', expected: '132' }
  ];

  console.log('Testing custom C++:');
  const cpp = await judgeRun({
    language: 'cpp',
    slug: 'custom-math',
    customMeta,
    code: `class Solution { public: int customMultiply(int a, int b) { return a * b; } };`,
    testcases
  });
  console.log('C++ Custom:', cpp.status, cpp.cases.map(c => c.output));

  console.log('Testing custom Python:');
  const py = await judgeRun({
    language: 'python',
    slug: 'custom-math',
    customMeta,
    code: `class Solution:
    def customMultiply(self, a: int, b: int) -> int:
        return a * b`,
    testcases
  });
  console.log('Python Custom:', py.status, py.cases.map(c => c.output));

  console.log('Testing custom JS:');
  const js = await judgeRun({
    language: 'javascript',
    slug: 'custom-math',
    customMeta,
    code: `var customMultiply = function(a, b) { return a * b; };`,
    testcases
  });
  console.log('JS Custom:', js.status, js.cases.map(c => c.output));

  console.log('Testing custom Java:');
  const java = await judgeRun({
    language: 'java',
    slug: 'custom-math',
    customMeta,
    code: `class Solution { public int customMultiply(int a, int b) { return a * b; } }`,
    testcases
  });
  console.log('Java Custom:', java.status, java.cases.map(c => c.output));
}

testCustom().catch(console.error);
