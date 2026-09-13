import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const javaCode = `
import java.io.*;
import java.util.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    public int diagonalSum(int[][] mat) {
        int n = mat.length;
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += mat[i][i];
            if (i != n - 1 - i) {
                sum += mat[i][n - 1 - i];
            }
        }
        return sum;
    }
}

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
        // Positional fallback
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
                    String inner = content.substring(i + 1, j);
                    String[] tokens = inner.split(",");
                    List<Integer> r = new ArrayList<>();
                    for (String t : tokens) {
                        String tr = trim(t);
                        if (!tr.isEmpty()) {
                            try { r.add(Integer.parseInt(tr)); } catch (Exception ignored) {}
                        }
                    }
                    int[] row = new int[r.size()];
                    for (int k = 0; k < r.size(); k++) row[k] = r.get(k);
                    rows.add(row);
                    i = j + 1;
                } else break;
            } else i++;
        }
        int[][] res = new int[rows.size()][];
        for (int k = 0; k < rows.size(); k++) res[k] = rows.get(k);
        return res;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            if (sb.length() > 0) sb.append("\\n");
            sb.append(line);
        }
        String allInput = sb.toString();
        Solution solver = new Solution();
        int[][] mat = parseIntMatrix(allInput, "mat", 0);
        int res = solver.diagonalSum(mat);
        System.out.println(res);
    }
}
`;

const tempDir = path.join(os.tmpdir(), 'test_java_harness');
fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(path.join(tempDir, 'Main.java'), javaCode);

try {
  execSync(`javac "${path.join(tempDir, 'Main.java')}"`);
  console.log('Java compilation successful!');
  const output = execSync(`java -cp "${tempDir}" Main`, {
    input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]'
  }).toString();
  console.log('Java Output:', output.trim());
} catch (e) {
  console.error('Java test failed:', e.message, e.stderr?.toString());
}
