function inferProblemMetaAndSnippets({ title = '', slug = '', examples = [] }) {
  // 1. Infer function name from slug or title
  let baseStr = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const words = baseStr.split(/[-_\s]+/).filter(Boolean);
  let funcName = words[0] || 'solve';
  for (let i = 1; i < words.length; i++) {
    funcName += words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }

  // 2. Parse example input for parameters
  const firstEx = examples[0] || { input: '', output: '' };
  const rawInput = firstEx.input || '';
  const rawOutput = (firstEx.output !== undefined && firstEx.output !== null) ? String(firstEx.output).trim() : '';

  // Bracket-aware chunker
  const parts = [];
  let bracketDepth = 0;
  let inStr = false;
  let quoteChar = null;
  let start = 0;
  for (let i = 0; i < rawInput.length; i++) {
    const c = rawInput[i];
    if ((c === '"' || c === "'") && (i === 0 || rawInput[i - 1] !== '\\')) {
      if (!inStr) { inStr = true; quoteChar = c; }
      else if (c === quoteChar) { inStr = false; }
    } else if (!inStr) {
      if (c === '[' || c === '{' || c === '(') bracketDepth++;
      else if (c === ']' || c === '}' || c === ')') bracketDepth--;
      else if (bracketDepth === 0 && (c === ',' || c === '\n')) {
        const chunk = rawInput.substring(start, i).trim();
        if (chunk) parts.push(chunk);
        start = i + 1;
      }
    }
  }
  const rem = rawInput.substring(start).trim();
  if (rem) parts.push(rem);

  const params = [];
  for (let idx = 0; idx < parts.length; idx++) {
    const p = parts[idx];
    let pName = `param${idx + 1}`;
    let pVal = p;
    if (p.includes('=')) {
      const eq = p.indexOf('=');
      pName = p.substring(0, eq).trim();
      pVal = p.substring(eq + 1).trim();
    }

    let pType = 'integer';
    const lowName = pName.toLowerCase();
    if (pVal.startsWith('[[') && pVal.endsWith(']]')) {
      if (pVal.includes('"') || pVal.includes("'")) {
        pType = (pVal.length < 50 && /['"][a-zA-Z0-9.+-]['"]/.test(pVal)) ? 'character[][]' : 'string[][]';
      } else {
        pType = 'integer[][]';
      }
    } else if (pVal.startsWith('[') && pVal.endsWith(']')) {
      if (lowName === 'head' || lowName.includes('listnode') || lowName === 'list1' || lowName === 'list2') {
        pType = 'ListNode';
      } else if (lowName === 'root' || lowName.includes('treenode')) {
        pType = 'TreeNode';
      } else if (pVal.includes('"') || pVal.includes("'")) {
        pType = 'string[]';
      } else {
        pType = 'integer[]';
      }
    } else if ((pVal.startsWith('"') && pVal.endsWith('"')) || (pVal.startsWith("'") && pVal.endsWith("'"))) {
      pType = pVal.length === 3 ? 'character' : 'string';
    } else if (pVal.toLowerCase() === 'true' || pVal.toLowerCase() === 'false') {
      pType = 'boolean';
    } else if (!isNaN(Number(pVal))) {
      pType = pVal.includes('.') ? 'double' : 'integer';
    }

    params.push({ name: pName, type: pType });
  }

  // 3. Infer return type
  let returnType = 'integer';
  if (rawOutput.toLowerCase() === 'true' || rawOutput.toLowerCase() === 'false') {
    returnType = 'boolean';
  } else if (rawOutput.startsWith('[[') && rawOutput.endsWith(']]')) {
    returnType = (rawOutput.includes('"') || rawOutput.includes("'")) ? 'string[][]' : 'integer[][]';
  } else if (rawOutput.startsWith('[') && rawOutput.endsWith(']')) {
    const hasListNode = params.some(p => p.type === 'ListNode');
    const hasTreeNode = params.some(p => p.type === 'TreeNode');
    if (hasListNode) returnType = 'ListNode';
    else if (hasTreeNode) returnType = 'TreeNode';
    else if (rawOutput.includes('"') || rawOutput.includes("'")) returnType = 'string[]';
    else returnType = 'integer[]';
  } else if ((rawOutput.startsWith('"') && rawOutput.endsWith('"')) || (rawOutput.startsWith("'") && rawOutput.endsWith("'"))) {
    returnType = 'string';
  } else if (rawOutput === 'null' || rawOutput === '') {
    returnType = 'void';
  } else if (!isNaN(Number(rawOutput))) {
    returnType = rawOutput.includes('.') ? 'double' : 'integer';
  }

  const metaData = {
    name: funcName,
    params,
    return: { type: returnType }
  };

  // 4. Generate C++ snippet
  const cppTypeMap = {
    'integer': 'int',
    'long': 'long long',
    'double': 'double',
    'boolean': 'bool',
    'character': 'char',
    'string': 'string',
    'integer[]': 'vector<int>&',
    'character[]': 'vector<char>&',
    'string[]': 'vector<string>&',
    'integer[][]': 'vector<vector<int>>&',
    'character[][]': 'vector<vector<char>>&',
    'string[][]': 'vector<vector<string>>&',
    'ListNode': 'ListNode*',
    'ListNode[]': 'vector<ListNode*>&',
    'TreeNode': 'TreeNode*',
    'void': 'void'
  };
  const cppRetType = (cppTypeMap[returnType] || 'int').replace('&', '');
  const cppArgs = params.map(p => `${cppTypeMap[p.type] || 'int'} ${p.name}`).join(', ');
  const cppCode = `class Solution {\npublic:\n    ${cppRetType} ${funcName}(${cppArgs}) {\n        \n    }\n};`;

  // 5. Generate Java snippet
  const javaTypeMap = {
    'integer': 'int',
    'long': 'long',
    'double': 'double',
    'boolean': 'boolean',
    'character': 'char',
    'string': 'String',
    'integer[]': 'int[]',
    'character[]': 'char[]',
    'string[]': 'String[]',
    'integer[][]': 'int[][]',
    'character[][]': 'char[][]',
    'string[][]': 'String[][]',
    'ListNode': 'ListNode',
    'ListNode[]': 'ListNode[]',
    'TreeNode': 'TreeNode',
    'void': 'void'
  };
  const javaRetType = javaTypeMap[returnType] || 'int';
  const javaArgs = params.map(p => `${javaTypeMap[p.type] || 'int'} ${p.name}`).join(', ');
  const javaCode = `class Solution {\n    public ${javaRetType} ${funcName}(${javaArgs}) {\n        \n    }\n}`;

  // 6. Generate Python snippet
  const pyTypeMap = {
    'integer': 'int',
    'long': 'int',
    'double': 'float',
    'boolean': 'bool',
    'character': 'str',
    'string': 'str',
    'integer[]': 'List[int]',
    'character[]': 'List[str]',
    'string[]': 'List[str]',
    'integer[][]': 'List[List[int]]',
    'character[][]': 'List[List[str]]',
    'string[][]': 'List[List[str]]',
    'ListNode': 'Optional[ListNode]',
    'ListNode[]': 'List[Optional[ListNode]]',
    'TreeNode': 'Optional[TreeNode]',
    'void': 'None'
  };
  const pyRetType = pyTypeMap[returnType] || 'int';
  const pyArgs = params.map(p => `${p.name}: ${pyTypeMap[p.type] || 'Any'}`).join(', ');
  const pyCode = `class Solution:\n    def ${funcName}(self, ${pyArgs}) -> ${pyRetType}:\n        pass\n`;

  // 7. Generate JavaScript snippet
  const jsTypeMap = {
    'integer': 'number',
    'long': 'number',
    'double': 'number',
    'boolean': 'boolean',
    'character': 'character',
    'string': 'string',
    'integer[]': 'number[]',
    'character[]': 'character[]',
    'string[]': 'string[]',
    'integer[][]': 'number[][]',
    'character[][]': 'character[][]',
    'string[][]': 'string[][]',
    'ListNode': 'ListNode',
    'TreeNode': 'TreeNode',
    'void': 'void'
  };
  const jsDocParams = params.map(p => ` * @param {${jsTypeMap[p.type] || '*'}} ${p.name}`).join('\n');
  const jsArgs = params.map(p => p.name).join(', ');
  const jsCode = `/**\n${jsDocParams}\n * @return {${jsTypeMap[returnType] || '*'}}\n */\nvar ${funcName} = function(${jsArgs}) {\n    \n};`;

  const codeSnippets = [
    { lang: 'C++', langSlug: 'cpp', code: cppCode },
    { lang: 'Java', langSlug: 'java', code: javaCode },
    { lang: 'Python 3', langSlug: 'python', code: pyCode },
    { lang: 'JavaScript', langSlug: 'javascript', code: jsCode }
  ];

  return { metaData, codeSnippets };
}

// Test cases
console.log('1. Matrix Diagonal Sum:');
console.log(JSON.stringify(inferProblemMetaAndSnippets({
  title: 'Matrix Diagonal Sum',
  slug: 'matrix-diagonal-sum',
  examples: [{ input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', output: '25' }]
}), null, 2));

console.log('\n2. Merge Two Sorted Lists:');
console.log(JSON.stringify(inferProblemMetaAndSnippets({
  title: 'Merge Two Sorted Lists',
  slug: 'merge-two-sorted-lists',
  examples: [{ input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }]
}), null, 2));
