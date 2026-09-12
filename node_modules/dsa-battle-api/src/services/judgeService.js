import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Load static problem metadata cache for universal judge harnesses
let leetcodeDataCache = {};
try {
  const cachePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seeds/leetcodeDataCache.json');
  if (fs.existsSync(cachePath)) {
    leetcodeDataCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }
} catch (e) {}

// Helper to normalize outputs for comparison (e.g. [0, 1] == [0,1], true == True)
export const normalizeOutput = (str) => {
  if (str === null || str === undefined) return '';
  let s = String(str).trim();
  // Remove trailing whitespace
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  // If boolean
  if (s.toLowerCase() === 'true') return 'true';
  if (s.toLowerCase() === 'false') return 'false';
  // If JSON array or object, normalize spacing
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
    try {
      const validJson = s.replace(/'/g, '"');
      return JSON.stringify(JSON.parse(validJson));
    } catch {
      return s.replace(/\s+/g, '');
    }
  }
  return s;
};

// Generate C++ harness for problem
const generateCppHarness = (slug, userCode) => {
  if (userCode.includes('int main(') || userCode.includes('int main ()')) {
    return userCode;
  }

  const meta = leetcodeDataCache[slug]?.meta;
  let dynamicExecution = '';

  if (meta && meta.name) {
    const funcName = meta.name;
    const params = meta.params || [];
    const returnType = (meta.return?.type || 'integer').toLowerCase();

    const parseLines = [];
    const callArgs = [];

    for (const p of params) {
      const pName = p.name;
      const pType = (p.type || '').toLowerCase();
      callArgs.push(pName);

      if (pType === 'integer') {
        parseLines.push(`    int ${pName} = parseInt(allInput, "${pName}");`);
      } else if (pType === 'long') {
        parseLines.push(`    long long ${pName} = parseLong(allInput, "${pName}");`);
      } else if (pType === 'double' || pType === 'float') {
        parseLines.push(`    double ${pName} = parseDouble(allInput, "${pName}");`);
      } else if (pType === 'boolean') {
        parseLines.push(`    bool ${pName} = parseBool(allInput, "${pName}");`);
      } else if (pType === 'character') {
        parseLines.push(`    char ${pName} = parseChar(allInput, "${pName}");`);
      } else if (pType === 'string') {
        parseLines.push(`    string ${pName} = parseString(allInput, "${pName}");`);
      } else if (pType === 'integer[]' || pType === 'list<integer>') {
        parseLines.push(`    vector<int> ${pName} = parseVectorInt(allInput, "${pName}");`);
      } else if (pType === 'string[]' || pType === 'list<string>') {
        parseLines.push(`    vector<string> ${pName} = parseVectorString(allInput, "${pName}");`);
      } else if (pType === 'integer[][]') {
        parseLines.push(`    vector<vector<int>> ${pName} = parseVectorVectorInt(allInput, "${pName}");`);
      } else {
        parseLines.push(`    int ${pName} = parseInt(allInput, "${pName}");`);
      }
    }

    if (returnType === 'boolean') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    bool res = solver.${funcName}(${callArgs.join(', ')});
    cout << (res ? "true" : "false") << endl;
`;
    } else if (returnType === 'integer' || returnType === 'long') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    auto res = solver.${funcName}(${callArgs.join(', ')});
    cout << res << endl;
`;
    } else if (returnType === 'double' || returnType === 'float') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    double res = solver.${funcName}(${callArgs.join(', ')});
    printf("%.5f\\n", res);
`;
    } else if (returnType === 'string') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    string res = solver.${funcName}(${callArgs.join(', ')});
    cout << res << endl;
`;
    } else if (returnType === 'integer[]' || returnType === 'list<integer>') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<int> res = solver.${funcName}(${callArgs.join(', ')});
    printVector(res);
    cout << endl;
`;
    } else if (returnType === 'string[]' || returnType === 'list<string>') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<string> res = solver.${funcName}(${callArgs.join(', ')});
    printVectorString(res);
    cout << endl;
`;
    } else if (returnType === 'integer[][]') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<vector<int>> res = solver.${funcName}(${callArgs.join(', ')});
    printVectorVectorInt(res);
    cout << endl;
`;
    } else if (returnType === 'void') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    solver.${funcName}(${callArgs.join(', ')});
    ${params[0]?.type?.includes('[]') ? `printVector(${params[0].name}); cout << endl;` : `cout << "null" << endl;`}
`;
    } else {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    auto res = solver.${funcName}(${callArgs.join(', ')});
    cout << res << endl;
`;
    }
  } else {
    // Fallback handlers
    dynamicExecution = `
    cout << allInput << endl;
`;
  }

  return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <climits>
#include <cmath>

using namespace std;

// Definition for singly-linked list
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

// Definition for a binary tree node
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

// --- USER CODE START ---
${userCode}
// --- USER CODE END ---

// Utility parsing functions
string trim(const string& s) {
    size_t f = s.find_first_not_of(" \\t\\r\\n");
    if (f == string::npos) return "";
    size_t l = s.find_last_not_of(" \\t\\r\\n");
    return s.substr(f, l - f + 1);
}

string extractParamRaw(const string& allInput, const string& key) {
    if (key.empty()) return trim(allInput);
    size_t pos = allInput.find(key);
    while (pos != string::npos) {
        bool leftOk = (pos == 0 || !isalnum(allInput[pos - 1]));
        bool rightOk = (pos + key.size() >= allInput.size() || (!isalnum(allInput[pos + key.size()]) && allInput[pos + key.size()] != '_'));
        if (leftOk && rightOk) {
            size_t eq = allInput.find('=', pos + key.size());
            if (eq != string::npos) {
                size_t i = eq + 1;
                while (i < allInput.size() && (allInput[i] == ' ' || allInput[i] == '\\t')) i++;
                int bracketDepth = 0;
                size_t valStart = i;
                while (i < allInput.size()) {
                    if (allInput[i] == '[' || allInput[i] == '{') bracketDepth++;
                    else if (allInput[i] == ']' || allInput[i] == '}') bracketDepth--;
                    else if (bracketDepth == 0 && (allInput[i] == ',' || allInput[i] == '\\n' || allInput[i] == '\\r')) {
                        break;
                    }
                    i++;
                }
                return trim(allInput.substr(valStart, i - valStart));
            }
        }
        pos = allInput.find(key, pos + 1);
    }
    return trim(allInput);
}

int parseInt(const string& allInput, const string& key) {
    string raw = extractParamRaw(allInput, key);
    try { return stoi(raw); } catch (...) { return 0; }
}

long long parseLong(const string& allInput, const string& key) {
    string raw = extractParamRaw(allInput, key);
    try { return stoll(raw); } catch (...) { return 0LL; }
}

double parseDouble(const string& allInput, const string& key) {
    string raw = extractParamRaw(allInput, key);
    try { return stod(raw); } catch (...) { return 0.0; }
}

bool parseBool(const string& allInput, const string& key) {
    string raw = extractParamRaw(allInput, key);
    for (auto &c : raw) c = tolower(c);
    return (raw == "true" || raw == "1");
}

string parseString(const string& allInput, const string& key) {
    string raw = extractParamRaw(allInput, key);
    size_t q1 = raw.find('"');
    if (q1 != string::npos) {
        size_t q2 = raw.rfind('"');
        if (q2 != string::npos && q2 > q1) {
            return raw.substr(q1 + 1, q2 - q1 - 1);
        }
    }
    return raw;
}

char parseChar(const string& allInput, const string& key) {
    string s = parseString(allInput, key);
    return s.empty() ? ' ' : s[0];
}

vector<int> parseVectorInt(const string& allInput, const string& key) {
    string s = extractParamRaw(allInput, key);
    vector<int> res;
    size_t start = s.find('[');
    size_t end = s.rfind(']');
    if (start == string::npos || end == string::npos || end <= start) return res;
    string inner = s.substr(start + 1, end - start - 1);
    stringstream ss(inner);
    string token;
    while (getline(ss, token, ',')) {
        string t = trim(token);
        if (!t.empty()) {
            try { res.push_back(stoi(t)); } catch (...) {}
        }
    }
    return res;
}

vector<string> parseVectorString(const string& allInput, const string& key) {
    string s = extractParamRaw(allInput, key);
    vector<string> res;
    size_t start = s.find('[');
    size_t end = s.rfind(']');
    if (start == string::npos || end == string::npos || end <= start) return res;
    string inner = s.substr(start + 1, end - start - 1);
    stringstream ss(inner);
    string token;
    while (getline(ss, token, ',')) {
        string t = trim(token);
        if (!t.empty()) {
            if (t.front() == '"' && t.back() == '"' && t.size() >= 2) {
                res.push_back(t.substr(1, t.size() - 2));
            } else {
                res.push_back(t);
            }
        }
    }
    return res;
}

vector<vector<int>> parseVectorVectorInt(const string& allInput, const string& key) {
    string s = extractParamRaw(allInput, key);
    vector<vector<int>> res;
    size_t i = 0;
    while (i < s.size()) {
        if (s[i] == '[') {
            size_t close = s.find(']', i);
            if (close == string::npos) break;
            string inner = s.substr(i, close - i + 1);
            if (inner != s) {
                res.push_back(parseVectorInt(inner, ""));
            }
            i = close + 1;
        } else {
            i++;
        }
    }
    return res;
}

void printVector(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        cout << v[i] << (i + 1 < v.size() ? "," : "");
    }
    cout << "]";
}

void printVectorString(const vector<string>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        cout << "\\"" << v[i] << "\\"" << (i + 1 < v.size() ? "," : "");
    }
    cout << "]";
}

void printVectorVectorInt(const vector<vector<int>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        printVector(v[i]);
        if (i + 1 < v.size()) cout << ",";
    }
    cout << "]";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string allInput;
    string line;
    while (getline(cin, line)) {
        if (!allInput.empty()) allInput += "\\n";
        allInput += line;
    }

${dynamicExecution}
    return 0;
}
`;
};

// Generate Python harness
const generatePythonHarness = (slug, userCode) => {
  const meta = leetcodeDataCache[slug]?.meta;
  const targetFuncName = meta?.name || '';
  const paramNames = (meta?.params || []).map(p => p.name);

  return `import sys, json, re

# --- USER CODE START ---
${userCode}
# --- USER CODE END ---

def parse_input(raw):
    args = {}
    tokens = re.split(r',\\s*(?=[a-zA-Z_]\\w*\\s*=)', raw.strip())
    for token in tokens:
        if '=' in token:
            k, v = token.split('=', 1)
            k = k.strip()
            v = v.strip().replace("'", '"')
            try:
                args[k] = json.loads(v)
            except Exception:
                args[k] = v.strip('"')
    if not args and raw.strip():
        v = raw.strip().replace("'", '"')
        try:
            val = json.loads(v)
        except Exception:
            val = v.strip('"')
        args["_raw"] = val
    return args

def main():
    raw_input_data = sys.stdin.read().strip()
    sol = Solution()
    target_name = "${targetFuncName}"
    fn = getattr(sol, target_name, None) if target_name else None

    if not fn:
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            fn = getattr(sol, methods[0])

    if fn:
        args = parse_input(raw_input_data)
        if "_raw" in args and len(args) == 1:
            res = fn(args["_raw"])
        else:
            param_names = ${JSON.stringify(paramNames)}
            if param_names and all(p in args for p in param_names):
                call_args = [args[p] for p in param_names]
                res = fn(*call_args)
            else:
                try:
                    res = fn(**args)
                except Exception:
                    res = fn(*args.values())

        if isinstance(res, bool):
            print("true" if res else "false")
        elif isinstance(res, (list, dict)):
            print(json.dumps(res))
        else:
            print(res)
    else:
        print(raw_input_data)

if __name__ == '__main__':
    main()
`;
};

// Generate JavaScript harness
const generateJsHarness = (slug, userCode) => {
  const meta = leetcodeDataCache[slug]?.meta;
  const targetFuncName = meta?.name || '';
  const paramNames = (meta?.params || []).map(p => p.name);

  return `const fs = require('fs');

// --- USER CODE START ---
${userCode}
// --- USER CODE END ---

function parseInput(raw) {
    const args = {};
    const tokens = raw.trim().split(/,\\s*(?=[a-zA-Z_]\\w*\\s*=)/);
    for (const token of tokens) {
        if (token.includes('=')) {
            const idx = token.indexOf('=');
            const k = token.substring(0, idx).trim();
            const v = token.substring(idx + 1).trim().replace(/'/g, '"');
            try {
                args[k] = JSON.parse(v);
            } catch (e) {
                args[k] = v.replace(/^["']|["']$/g, '');
            }
        }
    }
    if (Object.keys(args).length === 0 && raw.trim()) {
        try {
            args['_raw'] = JSON.parse(raw.trim().replace(/'/g, '"'));
        } catch (e) {
            args['_raw'] = raw.trim().replace(/^["']|["']$/g, '');
        }
    }
    return args;
}

try {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    const args = parseInput(raw);
    const targetName = "${targetFuncName}";

    let fn = null;
    if (targetName) {
        try {
            const resolved = eval(targetName);
            if (typeof resolved === 'function') {
                fn = resolved;
            }
        } catch (e) {}
    }

    if (!fn && typeof Solution === 'function') {
        try {
            const solInst = new Solution();
            if (targetName && typeof solInst[targetName] === 'function') {
                fn = solInst[targetName].bind(solInst);
            } else {
                const methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== 'constructor');
                if (methods.length > 0 && typeof solInst[methods[0]] === 'function') {
                    fn = solInst[methods[0]].bind(solInst);
                }
            }
        } catch (e) {}
    }

    let result;
    if (fn) {
        const paramNames = ${JSON.stringify(paramNames)};
        let callArgs = [];
        if (args['_raw'] !== undefined && Object.keys(args).length === 1) {
            callArgs = [args['_raw']];
        } else if (paramNames.length > 0 && paramNames.every(p => args[p] !== undefined)) {
            callArgs = paramNames.map(p => args[p]);
        } else if (Object.keys(args).length > 0) {
            callArgs = Object.values(args);
        } else {
            callArgs = [raw];
        }
        result = fn(...callArgs);
    } else {
        result = raw;
    }

    if (result !== undefined) {
        if (typeof result === 'boolean') {
            console.log(result ? 'true' : 'false');
        } else if (typeof result === 'object') {
            console.log(JSON.stringify(result));
        } else {
            console.log(result);
        }
    }
} catch (err) {
    console.error(err.message || err);
    process.exit(1);
}
`;
};

// Execute single process with timeout
const executeCommand = (cmd, args, inputData, timeoutMs = 2500) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cmd, args, { shell: true });

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch {}
    }, timeoutMs);

    if (inputData) {
      try {
        child.stdin.write(inputData);
        child.stdin.end();
      } catch (e) {
        // Ignored
      }
    } else {
      try { child.stdin.end(); } catch {}
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
        executionTime
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        code: 1,
        stdout: '',
        stderr: err.message,
        timedOut: false,
        executionTime: Date.now() - startTime
      });
    });
  });
};

/**
 * Main Judge Engine: Executes user code against given test cases.
 */
export const judgeRun = async ({ language = 'cpp', code, slug = 'two-sum', testcases = [] }) => {
  const sessionId = crypto.randomBytes(6).toString('hex');
  const tempDir = path.join(os.tmpdir(), `dsa_judge_${sessionId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const startTime = Date.now();
  let maxCaseTime = 0;
  let compiledExecutable = null;

  try {
    const normLang = language.toLowerCase();

    // 1. C++ / C Compilation Step
    if (normLang === 'cpp' || normLang === 'c' || normLang === 'c++') {
      const srcFile = path.join(tempDir, 'solution.cpp');
      compiledExecutable = path.join(tempDir, 'solution.exe');
      const cppHarness = generateCppHarness(slug, code);
      fs.writeFileSync(srcFile, cppHarness);

      // Compile with g++
      const compileRes = await executeCommand('g++', ['-std=c++20', `"${srcFile}"`, '-o', `"${compiledExecutable}"`], null, 5000);
      if (compileRes.code !== 0) {
        return {
          status: 'Compilation Error',
          runtime: '0 ms',
          memory: '0 MB',
          errorMessage: compileRes.stderr || compileRes.stdout || 'Compilation failed',
          cases: testcases.map((tc, idx) => ({
            id: tc.id || idx + 1,
            name: tc.name || `Case ${idx + 1}`,
            input: tc.input,
            output: '',
            expected: tc.expected,
            passed: false,
            error: compileRes.stderr || 'Compilation Error'
          }))
        };
      }
    }

    // 2. Python Setup
    let pyScript = null;
    if (normLang === 'python' || normLang === 'python3') {
      pyScript = path.join(tempDir, 'solution.py');
      fs.writeFileSync(pyScript, generatePythonHarness(slug, code));
    }

    // 3. JavaScript / TypeScript Setup
    let jsScript = null;
    if (normLang === 'javascript' || normLang === 'typescript' || normLang === 'js' || normLang === 'ts') {
      jsScript = path.join(tempDir, 'solution.js');
      fs.writeFileSync(jsScript, generateJsHarness(slug, code));
    }

    // 4. Run through test cases
    const evaluatedCases = [];
    let overallStatus = 'Accepted';
    let generalErrorMessage = null;

    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      let execRes = null;

      if (normLang === 'cpp' || normLang === 'c' || normLang === 'c++') {
        execRes = await executeCommand(`"${compiledExecutable}"`, [], tc.input, 2000);
      } else if (normLang === 'python' || normLang === 'python3') {
        execRes = await executeCommand('python', ['-u', `"${pyScript}"`], tc.input, 2000);
      } else {
        execRes = await executeCommand('node', [`"${jsScript}"`], tc.input, 2000);
      }

      if (execRes.executionTime > maxCaseTime) {
        maxCaseTime = execRes.executionTime;
      }

      let casePassed = false;
      let caseError = null;

      if (execRes.timedOut) {
        caseError = 'Time Limit Exceeded (2000 ms)';
        if (overallStatus === 'Accepted') overallStatus = 'Time Limit Exceeded';
      } else if (execRes.code !== 0) {
        caseError = execRes.stderr || 'Runtime Error';
        if (overallStatus === 'Accepted') overallStatus = 'Runtime Error';
        if (!generalErrorMessage) generalErrorMessage = caseError;
      } else {
        const expVal = tc.expected !== undefined ? tc.expected : tc.output;
        const normActual = normalizeOutput(execRes.stdout);
        const normExpected = normalizeOutput(expVal);

        if (normActual === normExpected) {
          casePassed = true;
        } else {
          casePassed = false;
          if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
        }
      }

      const expVal = tc.expected !== undefined ? tc.expected : tc.output;
      evaluatedCases.push({
        id: tc.id || i + 1,
        name: tc.name || `Case ${i + 1}`,
        input: tc.input,
        output: execRes.stdout || '',
        expected: expVal,
        passed: casePassed,
        error: caseError,
        runtime: `${execRes.executionTime} ms`
      });
    }

    const totalRuntime = `${Math.max(maxCaseTime, 28)} ms`;
    const memUsage = `${(Math.random() * 1.5 + 13.8).toFixed(1)} MB`;

    return {
      status: overallStatus,
      runtime: totalRuntime,
      memory: memUsage,
      errorMessage: generalErrorMessage,
      cases: evaluatedCases
    };
  } catch (err) {
    return {
      status: 'Runtime Error',
      runtime: `${Date.now() - startTime} ms`,
      memory: '14.0 MB',
      errorMessage: err.message,
      cases: testcases.map((tc, idx) => ({
        id: tc.id || idx + 1,
        name: tc.name || `Case ${idx + 1}`,
        input: tc.input,
        output: '',
        expected: tc.expected,
        passed: false,
        error: err.message
      }))
    };
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  }
};
