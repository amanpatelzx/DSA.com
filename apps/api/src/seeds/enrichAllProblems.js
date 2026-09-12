import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from '../models/Problem.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function enrichProblems() {
  await connectDB();

  const sourceFile = path.resolve(__dirname, '../../../../scratch_all_lc_results.json');
  if (!fs.existsSync(sourceFile)) {
    console.error('Source file not found:', sourceFile);
    process.exit(1);
  }

  const lcData = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  console.log(`Loaded LeetCode cache for ${Object.keys(lcData).length} problems.`);

  const problems = await Problem.find({});
  console.log(`Updating ${problems.length} problems in database...`);

  const frontendCache = {};
  const backendCache = {};
  let updatedCount = 0;

  for (const prob of problems) {
    const lc = lcData[prob.slug];
    if (!lc) {
      console.warn(`No LC data for: ${prob.slug}`);
      continue;
    }

    const relevantLangs = ['cpp', 'java', 'python3', 'python', 'javascript', 'typescript', 'c'];
    const filteredSnippets = (lc.codeSnippets || [])
      .filter(s => relevantLangs.includes(s.langSlug))
      .map(s => ({
        lang: s.langSlug === 'python3' ? 'python' : s.langSlug,
        langSlug: s.langSlug,
        code: s.code
      }));

    prob.codeSnippets = filteredSnippets;
    prob.metaData = lc.metaData;
    if (lc.title && prob.title !== lc.title) {
      // Keep problem title descriptive or update if it matches
      prob.title = lc.title;
    }

    // Ensure tags include official LC id if available
    if (lc.id && !prob.tags.some(t => new RegExp(`^LC-${lc.id}$`, 'i').test(t))) {
      prob.tags.push(`LC-${lc.id}`);
    }

    await prob.save();
    updatedCount++;

    // Prepare dictionary map for frontend and backend caches
    const snippetMap = {};
    for (const s of filteredSnippets) {
      snippetMap[s.langSlug] = s.code;
      if (s.langSlug === 'python3') snippetMap['python'] = s.code;
    }

    frontendCache[prob.slug] = {
      title: prob.title,
      meta: lc.metaData,
      snippets: snippetMap
    };

    backendCache[prob.slug] = {
      title: prob.title,
      meta: lc.metaData
    };
  }

  // Save frontend cache
  const webCacheDir = path.resolve(__dirname, '../../../web/src/utils');
  if (!fs.existsSync(webCacheDir)) {
    fs.mkdirSync(webCacheDir, { recursive: true });
  }
  const webCachePath = path.join(webCacheDir, 'leetcodeSnippetsCache.json');
  fs.writeFileSync(webCachePath, JSON.stringify(frontendCache, null, 2));
  console.log(`Wrote frontend cache to ${webCachePath}`);

  // Save backend cache
  const apiCachePath = path.join(__dirname, 'leetcodeDataCache.json');
  fs.writeFileSync(apiCachePath, JSON.stringify(backendCache, null, 2));
  console.log(`Wrote backend cache to ${apiCachePath}`);

  console.log(`Successfully enriched ${updatedCount} / ${problems.length} problems!`);
  await mongoose.disconnect();
}

enrichProblems().catch(err => {
  console.error('Enrichment error:', err);
  process.exit(1);
});
