import { inferProblemMetaAndSnippets } from '../apps/api/src/routes/problems.js';

const testInfer = inferProblemMetaAndSnippets({
  title: 'Matrix Block Sum',
  slug: 'matrix-block-sum',
  examples: [
    { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]], k = 1', output: '[[12,21,16],[27,45,33],[24,39,28]]' }
  ]
});

console.log('Inferred Meta:');
console.log(JSON.stringify(testInfer.metaData, null, 2));
console.log('\nGenerated C++ Snippet:');
console.log(testInfer.codeSnippets.find(s => s.langSlug === 'cpp')?.code);
console.log('\nGenerated Java Snippet:');
console.log(testInfer.codeSnippets.find(s => s.langSlug === 'java')?.code);
console.log('\nGenerated Python Snippet:');
console.log(testInfer.codeSnippets.find(s => s.langSlug === 'python')?.code);
console.log('\nGenerated JS Snippet:');
console.log(testInfer.codeSnippets.find(s => s.langSlug === 'javascript')?.code);
