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
const generateCppHarness = (slug, userCode, customMeta = null) => {
  if (userCode.includes('int main(') || userCode.includes('int main ()')) {
    return userCode;
  }

  const meta = customMeta || leetcodeDataCache[slug]?.meta;
  let dynamicExecution = '';

  if (meta && meta.name) {
    const funcName = meta.name;
    const params = meta.params || [];
    const returnType = (meta.return?.type || 'integer').toLowerCase();

    const parseLines = [];
    const callArgs = [];

    for (let idx = 0; idx < params.length; idx++) {
      const p = params[idx];
      const pName = p.name;
      const pType = (p.type || '').toLowerCase();
      callArgs.push(pName);

      if (pType === 'integer') {
        parseLines.push(`    int ${pName} = parseInt(allInput, "${pName}", ${idx});`);
      } else if (pType === 'long') {
        parseLines.push(`    long long ${pName} = parseLong(allInput, "${pName}", ${idx});`);
      } else if (pType === 'double' || pType === 'float') {
        parseLines.push(`    double ${pName} = parseDouble(allInput, "${pName}", ${idx});`);
      } else if (pType === 'boolean') {
        parseLines.push(`    bool ${pName} = parseBool(allInput, "${pName}", ${idx});`);
      } else if (pType === 'character') {
        parseLines.push(`    char ${pName} = parseChar(allInput, "${pName}", ${idx});`);
      } else if (pType === 'string') {
        parseLines.push(`    string ${pName} = parseString(allInput, "${pName}", ${idx});`);
      } else if (pType === 'integer[]' || pType === 'list<integer>') {
        parseLines.push(`    vector<int> ${pName} = parseVectorInt(allInput, "${pName}", ${idx});`);
      } else if (pType === 'character[]') {
        parseLines.push(`    vector<char> ${pName} = parseVectorChar(allInput, "${pName}", ${idx});`);
      } else if (pType === 'string[]' || pType === 'list<string>') {
        parseLines.push(`    vector<string> ${pName} = parseVectorString(allInput, "${pName}", ${idx});`);
      } else if (pType === 'integer[][]' || pType === 'list<list<integer>>') {
        parseLines.push(`    vector<vector<int>> ${pName} = parseVectorVectorInt(allInput, "${pName}", ${idx});`);
      } else if (pType === 'character[][]') {
        parseLines.push(`    vector<vector<char>> ${pName} = parseVectorVectorChar(allInput, "${pName}", ${idx});`);
      } else if (pType === 'string[][]' || pType === 'list<list<string>>') {
        parseLines.push(`    vector<vector<string>> ${pName} = parseVectorVectorString(allInput, "${pName}", ${idx});`);
      } else if (pType === 'listnode') {
        parseLines.push(`    ListNode* ${pName} = parseListNode(allInput, "${pName}", ${idx});`);
      } else if (pType === 'listnode[]' || pType === 'vector<listnode*>') {
        parseLines.push(`    vector<ListNode*> ${pName} = parseVectorListNode(allInput, "${pName}", ${idx});`);
      } else if (pType === 'treenode') {
        parseLines.push(`    TreeNode* ${pName} = parseTreeNode(allInput, "${pName}", ${idx});`);
      } else {
        parseLines.push(`    int ${pName} = parseInt(allInput, "${pName}", ${idx});`);
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
    } else if (returnType === 'character') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    char res = solver.${funcName}(${callArgs.join(', ')});
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
    } else if (returnType === 'character[]') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<char> res = solver.${funcName}(${callArgs.join(', ')});
    printVectorChar(res);
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
    } else if (returnType === 'integer[][]' || returnType === 'list<list<integer>>') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<vector<int>> res = solver.${funcName}(${callArgs.join(', ')});
    printVectorVectorInt(res);
    cout << endl;
`;
    } else if (returnType === 'character[][]') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<vector<char>> res = solver.${funcName}(${callArgs.join(', ')});
    printVectorVectorChar(res);
    cout << endl;
`;
    } else if (returnType === 'string[][]' || returnType === 'list<list<string>>') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    vector<vector<string>> res = solver.${funcName}(${callArgs.join(', ')});
    printVectorVectorString(res);
    cout << endl;
`;
    } else if (returnType === 'listnode') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    ListNode* res = solver.${funcName}(${callArgs.join(', ')});
    printListNode(res);
    cout << endl;
`;
    } else if (returnType === 'treenode') {
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    TreeNode* res = solver.${funcName}(${callArgs.join(', ')});
    printTreeNode(res);
    cout << endl;
`;
    } else if (returnType === 'void') {
      const firstParamType = (params[0]?.type || '').toLowerCase();
      let printCall = 'cout << "null" << endl;';
      if (firstParamType.includes('character[][]')) {
        printCall = `printVectorVectorChar(${params[0].name}); cout << endl;`;
      } else if (firstParamType.includes('[][]') || firstParamType.includes('list<list')) {
        printCall = `printVectorVectorInt(${params[0].name}); cout << endl;`;
      } else if (firstParamType.includes('char[]')) {
        printCall = `printVectorChar(${params[0].name}); cout << endl;`;
      } else if (firstParamType.includes('[]') || firstParamType.includes('list')) {
        printCall = `printVector(${params[0].name}); cout << endl;`;
      }
      dynamicExecution = `
    Solution solver;
${parseLines.join('\n')}
    solver.${funcName}(${callArgs.join(', ')});
    ${printCall}
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
    // Fallback handler if no meta
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

string extractParamRaw(const string& allInput, const string& key, int paramIndex = 0) {
    if (!key.empty()) {
        size_t pos = allInput.find(key);
        while (pos != string::npos) {
            bool leftOk = (pos == 0 || (!isalnum(allInput[pos - 1]) && allInput[pos - 1] != '_'));
            bool rightOk = (pos + key.size() >= allInput.size() || (!isalnum(allInput[pos + key.size()]) && allInput[pos + key.size()] != '_'));
            if (leftOk && rightOk) {
                size_t eq = allInput.find('=', pos + key.size());
                if (eq != string::npos) {
                    size_t i = eq + 1;
                    while (i < allInput.size() && (allInput[i] == ' ' || allInput[i] == '\\t')) i++;
                    int bracketDepth = 0;
                    bool inStr = false;
                    char quoteChar = 0;
                    size_t valStart = i;
                    while (i < allInput.size()) {
                        char c = allInput[i];
                        if ((c == '"' || c == '\\\'') && (i == 0 || allInput[i - 1] != '\\\\')) {
                            if (!inStr) { inStr = true; quoteChar = c; }
                            else if (c == quoteChar) { inStr = false; }
                        } else if (!inStr) {
                            if (c == '[' || c == '{' || c == '(') bracketDepth++;
                            else if (c == ']' || c == '}' || c == ')') bracketDepth--;
                            else if (bracketDepth == 0 && (c == ',' || c == '\\n' || c == '\\r')) {
                                break;
                            }
                        }
                        i++;
                    }
                    return trim(allInput.substr(valStart, i - valStart));
                }
            }
            pos = allInput.find(key, pos + 1);
        }
    }

    // Positional fallback: split top-level parameters by comma
    vector<string> parts;
    int bracketDepth = 0;
    bool inStr = false;
    char quoteChar = 0;
    size_t start = 0;
    for (size_t i = 0; i < allInput.size(); i++) {
        char c = allInput[i];
        if ((c == '"' || c == '\\\'') && (i == 0 || allInput[i - 1] != '\\\\')) {
            if (!inStr) { inStr = true; quoteChar = c; }
            else if (c == quoteChar) { inStr = false; }
        } else if (!inStr) {
            if (c == '[' || c == '{' || c == '(') bracketDepth++;
            else if (c == ']' || c == '}' || c == ')') bracketDepth--;
            else if (bracketDepth == 0 && (c == ',' || c == '\\n' || c == '\\r')) {
                if (i > start) {
                    parts.push_back(trim(allInput.substr(start, i - start)));
                }
                start = i + 1;
            }
        }
    }
    if (start < allInput.size()) {
        parts.push_back(trim(allInput.substr(start)));
    }

    if (paramIndex >= 0 && paramIndex < (int)parts.size()) {
        string p = parts[paramIndex];
        size_t eq = p.find('=');
        if (eq != string::npos) return trim(p.substr(eq + 1));
        return p;
    }

    return trim(allInput);
}

int parseInt(const string& allInput, const string& key, int idx = 0) {
    string raw = extractParamRaw(allInput, key, idx);
    try { return stoi(raw); } catch (...) { return 0; }
}

long long parseLong(const string& allInput, const string& key, int idx = 0) {
    string raw = extractParamRaw(allInput, key, idx);
    try { return stoll(raw); } catch (...) { return 0LL; }
}

double parseDouble(const string& allInput, const string& key, int idx = 0) {
    string raw = extractParamRaw(allInput, key, idx);
    try { return stod(raw); } catch (...) { return 0.0; }
}

bool parseBool(const string& allInput, const string& key, int idx = 0) {
    string raw = extractParamRaw(allInput, key, idx);
    for (auto &c : raw) c = tolower(c);
    return (raw == "true" || raw == "1");
}

string parseString(const string& allInput, const string& key, int idx = 0) {
    string raw = extractParamRaw(allInput, key, idx);
    size_t q1 = raw.find('"');
    if (q1 != string::npos) {
        size_t q2 = raw.rfind('"');
        if (q2 != string::npos && q2 > q1) {
            return raw.substr(q1 + 1, q2 - q1 - 1);
        }
    }
    return raw;
}

char parseChar(const string& allInput, const string& key, int idx = 0) {
    string s = parseString(allInput, key, idx);
    return s.empty() ? ' ' : s[0];
}

vector<int> parseVectorInt(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
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

vector<char> parseVectorChar(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
    vector<char> res;
    size_t start = s.find('[');
    size_t end = s.rfind(']');
    if (start == string::npos || end == string::npos || end <= start) return res;
    string inner = s.substr(start + 1, end - start - 1);
    stringstream ss(inner);
    string token;
    while (getline(ss, token, ',')) {
        string t = trim(token);
        if (!t.empty()) {
            if ((t.front() == '"' || t.front() == '\\\'') && t.size() >= 2) {
                res.push_back(t[1]);
            } else {
                res.push_back(t[0]);
            }
        }
    }
    return res;
}

vector<string> parseVectorString(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
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

vector<vector<int>> parseVectorVectorInt(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
    vector<vector<int>> res;
    size_t first = s.find('[');
    size_t last = s.rfind(']');
    if (first == string::npos || last == string::npos || last <= first) return res;
    
    string content = s.substr(first + 1, last - first - 1);
    size_t i = 0;
    while (i < content.size()) {
        if (content[i] == '[') {
            int depth = 1;
            size_t j = i + 1;
            while (j < content.size() && depth > 0) {
                if (content[j] == '[') depth++;
                else if (content[j] == ']') depth--;
                if (depth == 0) break;
                j++;
            }
            if (depth == 0 && j < content.size()) {
                string inner = content.substr(i, j - i + 1);
                res.push_back(parseVectorInt(inner, ""));
                i = j + 1;
            } else {
                break;
            }
        } else {
            i++;
        }
    }
    return res;
}

vector<vector<char>> parseVectorVectorChar(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
    vector<vector<char>> res;
    size_t first = s.find('[');
    size_t last = s.rfind(']');
    if (first == string::npos || last == string::npos || last <= first) return res;
    
    string content = s.substr(first + 1, last - first - 1);
    size_t i = 0;
    while (i < content.size()) {
        if (content[i] == '[') {
            int depth = 1;
            size_t j = i + 1;
            while (j < content.size() && depth > 0) {
                if (content[j] == '[') depth++;
                else if (content[j] == ']') depth--;
                if (depth == 0) break;
                j++;
            }
            if (depth == 0 && j < content.size()) {
                string inner = content.substr(i, j - i + 1);
                res.push_back(parseVectorChar(inner, ""));
                i = j + 1;
            } else {
                break;
            }
        } else {
            i++;
        }
    }
    return res;
}

vector<vector<string>> parseVectorVectorString(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
    vector<vector<string>> res;
    size_t first = s.find('[');
    size_t last = s.rfind(']');
    if (first == string::npos || last == string::npos || last <= first) return res;
    
    string content = s.substr(first + 1, last - first - 1);
    size_t i = 0;
    while (i < content.size()) {
        if (content[i] == '[') {
            int depth = 1;
            size_t j = i + 1;
            while (j < content.size() && depth > 0) {
                if (content[j] == '[') depth++;
                else if (content[j] == ']') depth--;
                if (depth == 0) break;
                j++;
            }
            if (depth == 0 && j < content.size()) {
                string inner = content.substr(i, j - i + 1);
                res.push_back(parseVectorString(inner, ""));
                i = j + 1;
            } else {
                break;
            }
        } else {
            i++;
        }
    }
    return res;
}

ListNode* parseListNode(const string& allInput, const string& key, int idx = 0) {
    vector<int> vals = parseVectorInt(allInput, key, idx);
    if (vals.empty()) return nullptr;
    ListNode dummy(0);
    ListNode* curr = &dummy;
    for (int v : vals) {
        curr->next = new ListNode(v);
        curr = curr->next;
    }
    return dummy.next;
}

vector<ListNode*> parseVectorListNode(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
    vector<ListNode*> res;
    size_t first = s.find('[');
    size_t last = s.rfind(']');
    if (first == string::npos || last == string::npos || last <= first) return res;
    string content = s.substr(first + 1, last - first - 1);
    size_t i = 0;
    while (i < content.size()) {
        if (content[i] == '[') {
            int depth = 1;
            size_t j = i + 1;
            while (j < content.size() && depth > 0) {
                if (content[j] == '[') depth++;
                else if (content[j] == ']') depth--;
                if (depth == 0) break;
                j++;
            }
            if (depth == 0 && j < content.size()) {
                string inner = content.substr(i, j - i + 1);
                res.push_back(parseListNode(inner, ""));
                i = j + 1;
            } else break;
        } else i++;
    }
    return res;
}

TreeNode* parseTreeNode(const string& allInput, const string& key, int idx = 0) {
    string s = extractParamRaw(allInput, key, idx);
    size_t start = s.find('[');
    size_t end = s.rfind(']');
    if (start == string::npos || end == string::npos || end <= start) return nullptr;
    string inner = s.substr(start + 1, end - start - 1);
    stringstream ss(inner);
    string token;
    vector<string> tokens;
    while (getline(ss, token, ',')) {
        string t = trim(token);
        if (!t.empty()) tokens.push_back(t);
    }
    if (tokens.empty() || tokens[0] == "null") return nullptr;
    
    TreeNode* root = new TreeNode(stoi(tokens[0]));
    queue<TreeNode*> q;
    q.push(root);
    size_t k = 1;
    while (!q.empty() && k < tokens.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (k < tokens.size()) {
            if (tokens[k] != "null") {
                curr->left = new TreeNode(stoi(tokens[k]));
                q.push(curr->left);
            }
            k++;
        }
        if (k < tokens.size()) {
            if (tokens[k] != "null") {
                curr->right = new TreeNode(stoi(tokens[k]));
                q.push(curr->right);
            }
            k++;
        }
    }
    return root;
}

void printVector(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        cout << v[i] << (i + 1 < v.size() ? "," : "");
    }
    cout << "]";
}

void printVectorChar(const vector<char>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        cout << "\\"" << v[i] << "\\"" << (i + 1 < v.size() ? "," : "");
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

void printVectorVectorChar(const vector<vector<char>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        printVectorChar(v[i]);
        if (i + 1 < v.size()) cout << ",";
    }
    cout << "]";
}

void printVectorVectorString(const vector<vector<string>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        printVectorString(v[i]);
        if (i + 1 < v.size()) cout << ",";
    }
    cout << "]";
}

void printListNode(ListNode* head) {
    cout << "[";
    ListNode* curr = head;
    while (curr) {
        cout << curr->val;
        if (curr->next) cout << ",";
        curr = curr->next;
    }
    cout << "]";
}

void printTreeNode(TreeNode* root) {
    if (!root) { cout << "[]"; return; }
    vector<string> vals;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (curr) {
            vals.push_back(to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            vals.push_back("null");
        }
    }
    while (!vals.empty() && vals.back() == "null") vals.pop_back();
    cout << "[";
    for (size_t i = 0; i < vals.size(); i++) {
        cout << vals[i] << (i + 1 < vals.size() ? "," : "");
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
const generatePythonHarness = (slug, userCode, customMeta = null) => {
  const meta = customMeta || leetcodeDataCache[slug]?.meta;
  const targetFuncName = meta?.name || '';
  const params = meta?.params || [];
  const returnType = (meta?.return?.type || '').toLowerCase();
  const outputParamIndex = meta?.output?.paramindex !== undefined ? meta.output.paramindex : 0;

  return `import sys, json, re
from collections import deque
from typing import List, Optional, Dict, Set, Tuple, Any, Deque

false = False
true = True
null = None

# Definition for singly-linked list
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Definition for a binary tree node
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_list(vals):
    if not vals or not isinstance(vals, list):
        return None
    dummy = ListNode(0)
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def list_to_arr(head):
    res = []
    curr = head
    while curr:
        res.append(curr.val)
        curr = curr.next
    return res

def build_tree(vals):
    if not vals or not isinstance(vals, list) or len(vals) == 0 or vals[0] is None:
        return None
    root = TreeNode(vals[0])
    q = deque([root])
    i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] is not None:
            node.left = TreeNode(vals[i])
            q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] is not None:
            node.right = TreeNode(vals[i])
            q.append(node.right)
        i += 1
    return root

def tree_to_arr(root):
    if not root:
        return []
    res = []
    q = deque([root])
    while q:
        node = q.popleft()
        if node:
            res.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res

def parse_param_chunks(raw):
    raw = raw.strip()
    if not raw:
        return {}, []
    parts = []
    bracket_depth = 0
    in_str = False
    quote_char = None
    start = 0
    for i, c in enumerate(raw):
        if (c == '"' or c == "'") and (i == 0 or raw[i-1] != '\\\\'):
            if not in_str:
                in_str = True
                quote_char = c
            elif c == quote_char:
                in_str = False
        elif not in_str:
            if c in '[{(':
                bracket_depth += 1
            elif c in ']})':
                bracket_depth -= 1
            elif bracket_depth == 0 and (c == ',' or c == '\\n' or c == '\\r'):
                chunk = raw[start:i].strip()
                if chunk:
                    parts.append(chunk)
                start = i + 1
    rem = raw[start:].strip()
    if rem:
        parts.append(rem)

    args = {}
    pos_args = []
    for p in parts:
        if '=' in p:
            k, v = p.split('=', 1)
            k = k.strip()
            v = v.strip().replace("'", '"')
            try:
                val = json.loads(v)
            except Exception:
                val = v.strip('"')
            args[k] = val
            pos_args.append(val)
        else:
            v = p.strip().replace("'", '"')
            try:
                val = json.loads(v)
            except Exception:
                val = v.strip('"')
            pos_args.append(val)
    return args, pos_args

# --- USER CODE START ---
${userCode}
# --- USER CODE END ---

def main():
    raw_input_data = sys.stdin.read().strip()
    sol = Solution()
    target_name = "${targetFuncName}"
    fn = getattr(sol, target_name, None) if target_name else None

    if not fn:
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            fn = getattr(sol, methods[0])

    if not fn:
        print(raw_input_data)
        return

    args_map, pos_args = parse_param_chunks(raw_input_data)
    meta_params = ${JSON.stringify(params)}
    call_args = []

    for idx, p in enumerate(meta_params):
        p_name = p.get('name')
        p_type = (p.get('type') or '').lower()
        val = args_map.get(p_name) if p_name in args_map else (pos_args[idx] if idx < len(pos_args) else None)

        if p_type == 'listnode':
            call_args.append(build_list(val))
        elif p_type == 'listnode[]' or p_type == 'list<listnode>':
            call_args.append([build_list(x) for x in val] if isinstance(val, list) else [])
        elif p_type == 'treenode':
            call_args.append(build_tree(val))
        else:
            call_args.append(val)

    if not call_args:
        if pos_args:
            call_args = pos_args
        elif args_map:
            call_args = list(args_map.values())
        elif raw_input_data:
            call_args = [raw_input_data]

    res = fn(*call_args)
    ret_type = "${returnType}"

    if ret_type == 'void' or (res is None and ${outputParamIndex} < len(call_args)):
        out_target = call_args[${outputParamIndex}]
        if isinstance(out_target, ListNode):
            print(json.dumps(list_to_arr(out_target)))
        elif isinstance(out_target, TreeNode):
            print(json.dumps(tree_to_arr(out_target)))
        elif isinstance(out_target, (list, dict)):
            print(json.dumps(out_target, separators=(',', ':')))
        elif out_target is not None:
            print(out_target)
        else:
            print("null")
        return

    if isinstance(res, ListNode):
        print(json.dumps(list_to_arr(res)))
    elif isinstance(res, TreeNode):
        print(json.dumps(tree_to_arr(res)))
    elif isinstance(res, bool):
        print("true" if res else "false")
    elif isinstance(res, (list, dict)):
        print(json.dumps(res, separators=(',', ':')))
    elif res is not None:
        print(res)

if __name__ == '__main__':
    main()
`;
};

// Generate JavaScript harness
const generateJsHarness = (slug, userCode, customMeta = null) => {
  const meta = customMeta || leetcodeDataCache[slug]?.meta;
  const targetFuncName = meta?.name || '';
  const params = meta?.params || [];
  const returnType = (meta?.return?.type || '').toLowerCase();
  const outputParamIndex = meta?.output?.paramindex !== undefined ? meta.output.paramindex : 0;

  return `const fs = require('fs');

function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}

function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
}

function buildList(vals) {
    if (!vals || !Array.isArray(vals)) return null;
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let v of vals) {
        curr.next = new ListNode(v);
        curr = curr.next;
    }
    return dummy.next;
}

function listToArr(head) {
    let res = [];
    let curr = head;
    while (curr) {
        res.push(curr.val);
        curr = curr.next;
    }
    return res;
}

function buildTree(vals) {
    if (!vals || !Array.isArray(vals) || vals.length === 0 || vals[0] === null) return null;
    let root = new TreeNode(vals[0]);
    let q = [root];
    let i = 1;
    while (q.length > 0 && i < vals.length) {
        let node = q.shift();
        if (i < vals.length && vals[i] !== null && vals[i] !== undefined) {
            node.left = new TreeNode(vals[i]);
            q.push(node.left);
        }
        i++;
        if (i < vals.length && vals[i] !== null && vals[i] !== undefined) {
            node.right = new TreeNode(vals[i]);
            q.push(node.right);
        }
        i++;
    }
    return root;
}

function treeToArr(root) {
    if (!root) return [];
    let res = [];
    let q = [root];
    while (q.length > 0) {
        let node = q.shift();
        if (node) {
            res.push(node.val);
            q.push(node.left);
            q.push(node.right);
        } else {
            res.push(null);
        }
    }
    while (res.length > 0 && res[res.length - 1] === null) {
        res.pop();
    }
    return res;
}

function parseParamChunks(raw) {
    raw = raw.trim();
    if (!raw) return { args: {}, pos: [] };
    const parts = [];
    let bracketDepth = 0;
    let inStr = false;
    let quoteChar = null;
    let start = 0;
    for (let i = 0; i < raw.length; i++) {
        const c = raw[i];
        if ((c === '"' || c === "'") && (i === 0 || raw[i-1] !== '\\\\')) {
            if (!inStr) {
                inStr = true;
                quoteChar = c;
            } else if (c === quoteChar) {
                inStr = false;
            }
        } else if (!inStr) {
            if (c === '[' || c === '{' || c === '(') bracketDepth++;
            else if (c === ']' || c === '}' || c === ')') bracketDepth--;
            else if (bracketDepth === 0 && (c === ',' || c === '\\n' || c === '\\r')) {
                const chunk = raw.substring(start, i).trim();
                if (chunk) parts.push(chunk);
                start = i + 1;
            }
        }
    }
    const rem = raw.substring(start).trim();
    if (rem) parts.push(rem);

    const args = {};
    const pos = [];
    for (const p of parts) {
        if (p.includes('=')) {
            const idx = p.indexOf('=');
            const k = p.substring(0, idx).trim();
            const v = p.substring(idx + 1).trim().replace(/'/g, '"');
            let val;
            try { val = JSON.parse(v); } catch (e) { val = v.replace(/^["']|["']$/g, ''); }
            args[k] = val;
            pos.push(val);
        } else {
            const v = p.trim().replace(/'/g, '"');
            let val;
            try { val = JSON.parse(v); } catch (e) { val = v.replace(/^["']|["']$/g, ''); }
            pos.push(val);
        }
    }
    return { args, pos };
}

// --- USER CODE START ---
${userCode}
// --- USER CODE END ---

try {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    const { args, pos } = parseParamChunks(raw);
    const targetName = "${targetFuncName}";

    let fn = null;
    if (targetName) {
        try {
            const resolved = eval(targetName);
            if (typeof resolved === 'function') fn = resolved;
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

    if (!fn) {
        console.log(raw);
        process.exit(0);
    }

    const metaParams = ${JSON.stringify(params)};
    let callArgs = [];

    for (let idx = 0; idx < metaParams.length; idx++) {
        const p = metaParams[idx];
        const pName = p.name;
        const pType = (p.type || '').toLowerCase();
        let val = args[pName] !== undefined ? args[pName] : (pos[idx] !== undefined ? pos[idx] : null);

        if (pType === 'listnode') {
            callArgs.push(buildList(val));
        } else if (pType === 'listnode[]' || pType === 'list<listnode>') {
            callArgs.push(Array.isArray(val) ? val.map(buildList) : []);
        } else if (pType === 'treenode') {
            callArgs.push(buildTree(val));
        } else {
            callArgs.push(val);
        }
    }

    if (callArgs.length === 0) {
        if (pos.length > 0) callArgs = pos;
        else if (Object.keys(args).length > 0) callArgs = Object.values(args);
        else callArgs = [raw];
    }

    const result = fn(...callArgs);
    const retType = "${returnType}";

    if (retType === 'void' || (result === undefined && ${outputParamIndex} < callArgs.length)) {
        const outTarget = callArgs[${outputParamIndex}];
        if (outTarget instanceof ListNode || (outTarget && outTarget.val !== undefined && outTarget.next !== undefined)) {
            console.log(JSON.stringify(listToArr(outTarget)));
        } else if (outTarget instanceof TreeNode || (outTarget && outTarget.left !== undefined)) {
            console.log(JSON.stringify(treeToArr(outTarget)));
        } else if (typeof outTarget === 'object' && outTarget !== null) {
            console.log(JSON.stringify(outTarget));
        } else if (outTarget !== undefined) {
            console.log(outTarget);
        } else {
            console.log("null");
        }
        process.exit(0);
    }

    if (result instanceof ListNode || (result && result.val !== undefined && result.next !== undefined)) {
        console.log(JSON.stringify(listToArr(result)));
    } else if (result instanceof TreeNode || (result && result.left !== undefined)) {
        console.log(JSON.stringify(treeToArr(result)));
    } else if (typeof result === 'boolean') {
        console.log(result ? 'true' : 'false');
    } else if (typeof result === 'object' && result !== null) {
        console.log(JSON.stringify(result));
    } else if (result !== undefined) {
        console.log(result);
    }
} catch (err) {
    console.error(err.message || err);
    process.exit(1);
}
`;
};

// Generate Java harness
const generateJavaHarness = (slug, userCode, customMeta = null) => {
  const meta = customMeta || leetcodeDataCache[slug]?.meta;
  const targetFuncName = meta?.name || 'solve';
  const params = meta?.params || [];
  const returnType = (meta?.return?.type || 'integer').toLowerCase();
  const outputParamIndex = meta?.output?.paramindex !== undefined ? meta.output.paramindex : 0;

  const parseLines = [];
  const callArgs = [];

  for (let idx = 0; idx < params.length; idx++) {
    const p = params[idx];
    const pName = p.name;
    const pType = (p.type || '').toLowerCase();
    callArgs.push(pName);

    if (pType === 'integer') {
      parseLines.push(`        int ${pName} = parseInt(allInput, "${pName}", ${idx});`);
    } else if (pType === 'long') {
      parseLines.push(`        long ${pName} = parseLong(allInput, "${pName}", ${idx});`);
    } else if (pType === 'double' || pType === 'float') {
      parseLines.push(`        double ${pName} = parseDouble(allInput, "${pName}", ${idx});`);
    } else if (pType === 'boolean') {
      parseLines.push(`        boolean ${pName} = parseBool(allInput, "${pName}", ${idx});`);
    } else if (pType === 'character') {
      parseLines.push(`        char ${pName} = parseChar(allInput, "${pName}", ${idx});`);
    } else if (pType === 'string') {
      parseLines.push(`        String ${pName} = parseString(allInput, "${pName}", ${idx});`);
    } else if (pType === 'integer[]' || pType === 'list<integer>') {
      parseLines.push(`        int[] ${pName} = parseIntArray(allInput, "${pName}", ${idx});`);
    } else if (pType === 'character[]') {
      parseLines.push(`        char[] ${pName} = parseCharArray(allInput, "${pName}", ${idx});`);
    } else if (pType === 'string[]' || pType === 'list<string>') {
      parseLines.push(`        String[] ${pName} = parseStringArray(allInput, "${pName}", ${idx});`);
    } else if (pType === 'integer[][]' || pType === 'list<list<integer>>') {
      parseLines.push(`        int[][] ${pName} = parseIntMatrix(allInput, "${pName}", ${idx});`);
    } else if (pType === 'character[][]') {
      parseLines.push(`        char[][] ${pName} = parseCharMatrix(allInput, "${pName}", ${idx});`);
    } else if (pType === 'string[][]' || pType === 'list<list<string>>') {
      parseLines.push(`        String[][] ${pName} = parseStringMatrix(allInput, "${pName}", ${idx});`);
    } else if (pType === 'listnode') {
      parseLines.push(`        ListNode ${pName} = parseListNode(allInput, "${pName}", ${idx});`);
    } else if (pType === 'treenode') {
      parseLines.push(`        TreeNode ${pName} = parseTreeNode(allInput, "${pName}", ${idx});`);
    } else {
      parseLines.push(`        int ${pName} = parseInt(allInput, "${pName}", ${idx});`);
    }
  }

  let executionSnippet = '';
  if (returnType === 'void') {
    const targetParam = params[outputParamIndex]?.name || params[0]?.name || 'res';
    const targetType = (params[outputParamIndex]?.type || params[0]?.type || '').toLowerCase();
    let printStmt = 'System.out.println("null");';
    if (targetType.includes('character[][]')) printStmt = `printCharMatrix(${targetParam});`;
    else if (targetType.includes('[][]')) printStmt = `printIntMatrix(${targetParam});`;
    else if (targetType.includes('char[]')) printStmt = `printCharArray(${targetParam});`;
    else if (targetType.includes('[]')) printStmt = `printIntArray(${targetParam});`;
    else if (targetType === 'listnode') printStmt = `printListNode(${targetParam});`;
    else if (targetType === 'treenode') printStmt = `printTreeNode(${targetParam});`;

    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        solver.${targetFuncName}(${callArgs.join(', ')});
        ${printStmt}
    `;
  } else if (returnType === 'boolean') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        boolean res = solver.${targetFuncName}(${callArgs.join(', ')});
        System.out.println(res ? "true" : "false");
    `;
  } else if (returnType === 'integer' || returnType === 'long') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        var res = solver.${targetFuncName}(${callArgs.join(', ')});
        System.out.println(res);
    `;
  } else if (returnType === 'double' || returnType === 'float') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        double res = solver.${targetFuncName}(${callArgs.join(', ')});
        System.out.printf("%.5f\\n", res);
    `;
  } else if (returnType === 'string' || returnType === 'character') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        var res = solver.${targetFuncName}(${callArgs.join(', ')});
        System.out.println(res);
    `;
  } else if (returnType === 'integer[]' || returnType === 'list<integer>') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        var res = solver.${targetFuncName}(${callArgs.join(', ')});
        if (res instanceof int[]) printIntArray((int[])res);
        else if (res instanceof List) printIntList((List<?>)res);
        else System.out.println(res);
    `;
  } else if (returnType === 'integer[][]' || returnType === 'list<list<integer>>') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        var res = solver.${targetFuncName}(${callArgs.join(', ')});
        if (res instanceof int[][]) printIntMatrix((int[][])res);
        else if (res instanceof List) printIntMatrixList((List<?>)res);
        else System.out.println(res);
    `;
  } else if (returnType === 'character[][]') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        var res = solver.${targetFuncName}(${callArgs.join(', ')});
        if (res instanceof char[][]) printCharMatrix((char[][])res);
        else System.out.println(res);
    `;
  } else if (returnType === 'listnode') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        ListNode res = solver.${targetFuncName}(${callArgs.join(', ')});
        printListNode(res);
    `;
  } else if (returnType === 'treenode') {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        TreeNode res = solver.${targetFuncName}(${callArgs.join(', ')});
        printTreeNode(res);
    `;
  } else {
    executionSnippet = `
        Solution solver = new Solution();
${parseLines.join('\n')}
        var res = solver.${targetFuncName}(${callArgs.join(', ')});
        System.out.println(res);
    `;
  }

  return `import java.io.*;
import java.util.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

// --- USER CODE START ---
${userCode}
// --- USER CODE END ---

public class Main {
    static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    static String extractParamRaw(String allInput, String key, int paramIndex) {
        if (key != null && !key.isEmpty()) {
            int pos = allInput.indexOf(key);
            while (pos != -1) {
                boolean leftOk = (pos == 0 || (!Character.isLetterOrDigit(allInput.charAt(pos - 1)) && allInput.charAt(pos - 1) != '_'));
                boolean rightOk = (pos + key.length() >= allInput.length() || (!Character.isLetterOrDigit(allInput.charAt(pos + key.length())) && allInput.charAt(pos + key.length()) != '_'));
                if (leftOk && rightOk) {
                    int eq = allInput.indexOf('=', pos + key.length());
                    if (eq != -1) {
                        int i = eq + 1;
                        while (i < allInput.length() && (allInput.charAt(i) == ' ' || allInput.charAt(i) == '\\t')) i++;
                        int bracketDepth = 0;
                        boolean inStr = false;
                        char quoteChar = 0;
                        int valStart = i;
                        while (i < allInput.length()) {
                            char c = allInput.charAt(i);
                            if ((c == '"' || c == '\\'') && (i == 0 || allInput.charAt(i - 1) != '\\\\')) {
                                if (!inStr) { inStr = true; quoteChar = c; }
                                else if (c == quoteChar) { inStr = false; }
                            } else if (!inStr) {
                                if (c == '[' || c == '{' || c == '(') bracketDepth++;
                                else if (c == ']' || c == '}' || c == ')') bracketDepth--;
                                else if (bracketDepth == 0 && (c == ',' || c == '\\n' || c == '\\r')) {
                                    break;
                                }
                            }
                            i++;
                        }
                        return trim(allInput.substring(valStart, i));
                    }
                }
                pos = allInput.indexOf(key, pos + 1);
            }
        }
        List<String> parts = new ArrayList<>();
        int bracketDepth = 0;
        boolean inStr = false;
        char quoteChar = 0;
        int start = 0;
        for (int i = 0; i < allInput.length(); i++) {
            char c = allInput.charAt(i);
            if ((c == '"' || c == '\\'') && (i == 0 || allInput.charAt(i - 1) != '\\\\')) {
                if (!inStr) { inStr = true; quoteChar = c; }
                else if (c == quoteChar) { inStr = false; }
            } else if (!inStr) {
                if (c == '[' || c == '{' || c == '(') bracketDepth++;
                else if (c == ']' || c == '}' || c == ')') bracketDepth--;
                else if (bracketDepth == 0 && (c == ',' || c == '\\n' || c == '\\r')) {
                    if (i > start) parts.add(trim(allInput.substring(start, i)));
                    start = i + 1;
                }
            }
        }
        if (start < allInput.length()) parts.add(trim(allInput.substring(start)));
        if (paramIndex >= 0 && paramIndex < parts.size()) {
            String p = parts.get(paramIndex);
            int eq = p.indexOf('=');
            if (eq != -1) return trim(p.substring(eq + 1));
            return p;
        }
        return trim(allInput);
    }

    static int parseInt(String allInput, String key, int idx) {
        String raw = extractParamRaw(allInput, key, idx);
        try { return Integer.parseInt(raw); } catch (Exception e) { return 0; }
    }

    static long parseLong(String allInput, String key, int idx) {
        String raw = extractParamRaw(allInput, key, idx);
        try { return Long.parseLong(raw); } catch (Exception e) { return 0L; }
    }

    static double parseDouble(String allInput, String key, int idx) {
        String raw = extractParamRaw(allInput, key, idx);
        try { return Double.parseDouble(raw); } catch (Exception e) { return 0.0; }
    }

    static boolean parseBool(String allInput, String key, int idx) {
        String raw = extractParamRaw(allInput, key, idx).toLowerCase();
        return raw.equals("true") || raw.equals("1");
    }

    static String parseString(String allInput, String key, int idx) {
        String raw = extractParamRaw(allInput, key, idx);
        int q1 = raw.indexOf('"');
        if (q1 != -1) {
            int q2 = raw.lastIndexOf('"');
            if (q2 > q1) return raw.substring(q1 + 1, q2);
        }
        return raw;
    }

    static char parseChar(String allInput, String key, int idx) {
        String s = parseString(allInput, key, idx);
        return s.isEmpty() ? ' ' : s.charAt(0);
    }

    static int[] parseIntArray(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || end <= start) return new int[0];
        String inner = s.substring(start + 1, end);
        String[] tokens = inner.split(",");
        List<Integer> list = new ArrayList<>();
        for (String t : tokens) {
            String tr = trim(t);
            if (!tr.isEmpty()) {
                try { list.add(Integer.parseInt(tr)); } catch (Exception ignored) {}
            }
        }
        int[] res = new int[list.size()];
        for (int i = 0; i < list.size(); i++) res[i] = list.get(i);
        return res;
    }

    static char[] parseCharArray(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || end <= start) return new char[0];
        String inner = s.substring(start + 1, end);
        String[] tokens = inner.split(",");
        List<Character> list = new ArrayList<>();
        for (String t : tokens) {
            String tr = trim(t).replace("\\"", "").replace("'", "");
            if (!tr.isEmpty()) list.add(tr.charAt(0));
        }
        char[] res = new char[list.size()];
        for (int i = 0; i < list.size(); i++) res[i] = list.get(i);
        return res;
    }

    static String[] parseStringArray(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || end <= start) return new String[0];
        String inner = s.substring(start + 1, end);
        String[] tokens = inner.split(",");
        List<String> list = new ArrayList<>();
        for (String t : tokens) {
            String tr = trim(t);
            if (tr.startsWith("\\"") && tr.endsWith("\\"") && tr.length() >= 2) {
                list.add(tr.substring(1, tr.length() - 1));
            } else if (!tr.isEmpty()) {
                list.add(tr);
            }
        }
        return list.toArray(new String[0]);
    }

    static int[][] parseIntMatrix(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int first = s.indexOf('[');
        int last = s.lastIndexOf(']');
        if (first == -1 || last == -1 || last <= first) return new int[0][0];
        String content = s.substring(first + 1, last);
        List<int[]> rows = new ArrayList<>();
        int i = 0;
        while (i < content.length()) {
            if (content.charAt(i) == '[') {
                int depth = 1;
                int j = i + 1;
                while (j < content.length() && depth > 0) {
                    if (content.charAt(j) == '[') depth++;
                    else if (content.charAt(j) == ']') depth--;
                    if (depth == 0) break;
                    j++;
                }
                if (depth == 0 && j < content.length()) {
                    String inner = content.substring(i, j + 1);
                    rows.add(parseIntArray(inner, "", 0));
                    i = j + 1;
                } else break;
            } else i++;
        }
        return rows.toArray(new int[0][]);
    }

    static char[][] parseCharMatrix(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int first = s.indexOf('[');
        int last = s.lastIndexOf(']');
        if (first == -1 || last == -1 || last <= first) return new char[0][0];
        String content = s.substring(first + 1, last);
        List<char[]> rows = new ArrayList<>();
        int i = 0;
        while (i < content.length()) {
            if (content.charAt(i) == '[') {
                int depth = 1;
                int j = i + 1;
                while (j < content.length() && depth > 0) {
                    if (content.charAt(j) == '[') depth++;
                    else if (content.charAt(j) == ']') depth--;
                    if (depth == 0) break;
                    j++;
                }
                if (depth == 0 && j < content.length()) {
                    String inner = content.substring(i, j + 1);
                    rows.add(parseCharArray(inner, "", 0));
                    i = j + 1;
                } else break;
            } else i++;
        }
        return rows.toArray(new char[0][]);
    }

    static String[][] parseStringMatrix(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int first = s.indexOf('[');
        int last = s.lastIndexOf(']');
        if (first == -1 || last == -1 || last <= first) return new String[0][0];
        String content = s.substring(first + 1, last);
        List<String[]> rows = new ArrayList<>();
        int i = 0;
        while (i < content.length()) {
            if (content.charAt(i) == '[') {
                int depth = 1;
                int j = i + 1;
                while (j < content.length() && depth > 0) {
                    if (content.charAt(j) == '[') depth++;
                    else if (content.charAt(j) == ']') depth--;
                    if (depth == 0) break;
                    j++;
                }
                if (depth == 0 && j < content.length()) {
                    String inner = content.substring(i, j + 1);
                    rows.add(parseStringArray(inner, "", 0));
                    i = j + 1;
                } else break;
            } else i++;
        }
        return rows.toArray(new String[0][]);
    }

    static ListNode parseListNode(String allInput, String key, int idx) {
        int[] vals = parseIntArray(allInput, key, idx);
        if (vals.length == 0) return null;
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for (int v : vals) {
            curr.next = new ListNode(v);
            curr = curr.next;
        }
        return dummy.next;
    }

    static TreeNode parseTreeNode(String allInput, String key, int idx) {
        String s = extractParamRaw(allInput, key, idx);
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || end <= start) return null;
        String inner = s.substring(start + 1, end);
        String[] tokens = inner.split(",");
        List<String> list = new ArrayList<>();
        for (String t : tokens) {
            String tr = trim(t);
            if (!tr.isEmpty()) list.add(tr);
        }
        if (list.isEmpty() || list.get(0).equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(list.get(0)));
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        int k = 1;
        while (!q.isEmpty() && k < list.size()) {
            TreeNode curr = q.poll();
            if (k < list.size()) {
                if (!list.get(k).equals("null")) {
                    curr.left = new TreeNode(Integer.parseInt(list.get(k)));
                    q.add(curr.left);
                }
                k++;
            }
            if (k < list.size()) {
                if (!list.get(k).equals("null")) {
                    curr.right = new TreeNode(Integer.parseInt(list.get(k)));
                    q.add(curr.right);
                }
                k++;
            }
        }
        return root;
    }

    static void printIntArray(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(arr[i]);
            if (i + 1 < arr.length) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printIntList(List<?> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append(list.get(i));
            if (i + 1 < list.size()) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printCharArray(char[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append("\\"").append(arr[i]).append("\\"");
            if (i + 1 < arr.length) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printIntMatrix(int[][] mat) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < mat.length; i++) {
            sb.append("[");
            for (int j = 0; j < mat[i].length; j++) {
                sb.append(mat[i][j]);
                if (j + 1 < mat[i].length) sb.append(",");
            }
            sb.append("]");
            if (i + 1 < mat.length) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printIntMatrixList(List<?> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            Object row = list.get(i);
            if (row instanceof List) {
                List<?> r = (List<?>) row;
                sb.append("[");
                for (int j = 0; j < r.size(); j++) {
                    sb.append(r.get(j));
                    if (j + 1 < r.size()) sb.append(",");
                }
                sb.append("]");
            } else if (row instanceof int[]) {
                int[] r = (int[]) row;
                sb.append("[");
                for (int j = 0; j < r.length; j++) {
                    sb.append(r[j]);
                    if (j + 1 < r.length) sb.append(",");
                }
                sb.append("]");
            }
            if (i + 1 < list.size()) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printCharMatrix(char[][] mat) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < mat.length; i++) {
            sb.append("[");
            for (int j = 0; j < mat[i].length; j++) {
                sb.append("\\"").append(mat[i][j]).append("\\"");
                if (j + 1 < mat[i].length) sb.append(",");
            }
            sb.append("]");
            if (i + 1 < mat.length) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printListNode(ListNode head) {
        StringBuilder sb = new StringBuilder("[");
        ListNode curr = head;
        while (curr != null) {
            sb.append(curr.val);
            if (curr.next != null) sb.append(",");
            curr = curr.next;
        }
        sb.append("]");
        System.out.println(sb);
    }

    static void printTreeNode(TreeNode root) {
        if (root == null) { System.out.println("[]"); return; }
        List<String> vals = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode curr = q.poll();
            if (curr != null) {
                vals.add(String.valueOf(curr.val));
                q.add(curr.left);
                q.add(curr.right);
            } else {
                vals.add("null");
            }
        }
        while (!vals.isEmpty() && vals.get(vals.size() - 1).equals("null")) {
            vals.remove(vals.size() - 1);
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vals.size(); i++) {
            sb.append(vals.get(i));
            if (i + 1 < vals.size()) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb);
    }

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            if (sb.length() > 0) sb.append("\\n");
            sb.append(line);
        }
        String allInput = sb.toString();
${executionSnippet}
    }
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
export const judgeRun = async ({ language = 'cpp', code, slug = 'two-sum', testcases = [], customMeta = null }) => {
  const sessionId = crypto.randomBytes(6).toString('hex');
  const tempDir = path.join(os.tmpdir(), `dsa_judge_${sessionId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const startTime = Date.now();
  let maxCaseTime = 0;
  let compiledExecutable = null;

  // Resolve metadata: customMeta -> leetcodeDataCache -> MongoDB fallback
  let meta = customMeta || leetcodeDataCache[slug]?.meta;
  if (!meta) {
    try {
      const Problem = (await import('../models/Problem.js')).default;
      const pDoc = await Problem.findOne({ slug }).select('metaData').lean();
      if (pDoc?.metaData) {
        meta = pDoc.metaData;
      }
    } catch (e) {}
  }

  try {
    const normLang = language.toLowerCase();

    // 1. C++ / C Compilation Step
    if (normLang === 'cpp' || normLang === 'c' || normLang === 'c++') {
      const srcFile = path.join(tempDir, 'solution.cpp');
      compiledExecutable = path.join(tempDir, 'solution.exe');
      const cppHarness = generateCppHarness(slug, code, meta);
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

    // 2. Java Compilation Step
    if (normLang === 'java') {
      const srcFile = path.join(tempDir, 'Main.java');
      const javaHarness = generateJavaHarness(slug, code, meta);
      fs.writeFileSync(srcFile, javaHarness);

      // Compile with javac
      const compileRes = await executeCommand('javac', [`"${srcFile}"`], null, 6000);
      if (compileRes.code !== 0) {
        return {
          status: 'Compilation Error',
          runtime: '0 ms',
          memory: '0 MB',
          errorMessage: compileRes.stderr || compileRes.stdout || 'Java Compilation failed',
          cases: testcases.map((tc, idx) => ({
            id: tc.id || idx + 1,
            name: tc.name || `Case ${idx + 1}`,
            input: tc.input,
            output: '',
            expected: tc.expected,
            passed: false,
            error: compileRes.stderr || 'Java Compilation Error'
          }))
        };
      }
    }

    // 3. Python Setup
    let pyScript = null;
    if (normLang === 'python' || normLang === 'python3') {
      pyScript = path.join(tempDir, 'solution.py');
      fs.writeFileSync(pyScript, generatePythonHarness(slug, code, meta));
    }

    // 4. JavaScript / TypeScript Setup
    let jsScript = null;
    if (normLang === 'javascript' || normLang === 'typescript' || normLang === 'js' || normLang === 'ts') {
      jsScript = path.join(tempDir, 'solution.js');
      fs.writeFileSync(jsScript, generateJsHarness(slug, code, meta));
    }

    // 5. Run through test cases
    const evaluatedCases = [];
    let overallStatus = 'Accepted';
    let generalErrorMessage = null;

    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      let execRes = null;

      if (normLang === 'cpp' || normLang === 'c' || normLang === 'c++') {
        execRes = await executeCommand(`"${compiledExecutable}"`, [], tc.input, 2000);
      } else if (normLang === 'java') {
        execRes = await executeCommand('java', ['-cp', `"${tempDir}"`, 'Main'], tc.input, 2500);
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
