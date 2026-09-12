async function runVerification() {
  console.log('=== VERIFYING RANDOM 1v1 BATTLE PROBLEM SELECTION ===\n');

  // 1. Test modes and counts
  const testCases = [
    { mode: 'bullet', count: 1, expectedDiff: 'Easy' },
    { mode: 'bullet', count: 3, expectedDiff: 'Easy' },
    { mode: 'blitz', count: 2 },
    { mode: 'rapid', count: 1, expectedDiff: 'Medium' },
    { mode: 'rapid', count: 2, expectedDiff: 'Medium' },
    { mode: 'classical', count: 1, expectedDiff: 'Hard' },
    { mode: 'classical', count: 3, expectedDiff: 'Hard' },
    { difficulty: 'easy', count: 2, expectedDiff: 'Easy' },
    { difficulty: 'medium', count: 3, expectedDiff: 'Medium' },
    { difficulty: 'hard', count: 2, expectedDiff: 'Hard' },
    { difficulty: 'mixed', count: 3 }
  ];

  for (const tc of testCases) {
    const params = new URLSearchParams();
    if (tc.mode) params.append('mode', tc.mode);
    if (tc.difficulty) params.append('difficulty', tc.difficulty);
    if (tc.count) params.append('count', tc.count.toString());

    const res = await fetch(`http://localhost:5000/api/problems/random?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed request for ${params.toString()}: ${res.status}`);
    }
    const data = await res.json();
    console.log(`[PASS] ${params.toString()} -> returned ${data.slugs.length} problems:`, data.slugs);

    if (data.slugs.length !== tc.count) {
      throw new Error(`Expected ${tc.count} problems, got ${data.slugs.length}`);
    }

    // Check uniqueness within match
    const uniqueSlugs = new Set(data.slugs);
    if (uniqueSlugs.size !== tc.count) {
      throw new Error(`Duplicate problem in match: ${data.slugs.join(', ')}`);
    }

    // Check difficulty if expected
    if (tc.expectedDiff) {
      for (const p of data.problems) {
        if (p.difficulty.toLowerCase() !== tc.expectedDiff.toLowerCase()) {
          throw new Error(`Expected difficulty ${tc.expectedDiff}, got ${p.difficulty} for ${p.slug}`);
        }
      }
    }
  }

  // 2. Test distribution across the catalog over 40 trials
  console.log('\n--- Testing Catalog Distribution across beginning, middle, end ---');
  const allProblems = await (await fetch('http://localhost:5000/api/problems')).json();
  const slugToIndex = {};
  allProblems.forEach((p, idx) => {
    slugToIndex[p.slug] = idx;
  });
  console.log(`Total catalog size in DB: ${allProblems.length}`);

  const sampledIndices = [];
  const sampledSlugs = new Set();

  for (let i = 0; i < 40; i++) {
    const res = await (await fetch('http://localhost:5000/api/problems/random?count=1')).json();
    const slug = res.slugs[0];
    sampledSlugs.add(slug);
    const idx = slugToIndex[slug];
    if (idx !== undefined) {
      sampledIndices.push(idx);
    }
  }

  const minIdx = Math.min(...sampledIndices);
  const maxIdx = Math.max(...sampledIndices);
  const avgIdx = Math.round(sampledIndices.reduce((a, b) => a + b, 0) / sampledIndices.length);

  console.log(`Sampled ${sampledIndices.length} single-pick matches:`);
  console.log(`- Unique problems picked: ${sampledSlugs.size} / 40`);
  console.log(`- Min index sampled: ${minIdx} (e.g. ${allProblems[minIdx]?.slug})`);
  console.log(`- Max index sampled: ${maxIdx} (e.g. ${allProblems[maxIdx]?.slug})`);
  console.log(`- Average index sampled: ${avgIdx} (out of ${allProblems.length - 1})`);

  if (maxIdx < 100) {
    throw new Error(`Problem selection is still clustered near the beginning! Max index: ${maxIdx}`);
  }

  // 3. Test exclusion of recently selected problems
  console.log('\n--- Testing Anti-Repetition with Exclude Slugs ---');
  const excludeList = Array.from(sampledSlugs).slice(0, 10);
  const excludeRes = await (await fetch(`http://localhost:5000/api/problems/random?count=5&exclude=${excludeList.join(',')}`)).json();
  const overlap = excludeRes.slugs.filter(s => excludeList.includes(s));
  console.log('Excluded slugs count:', excludeList.length);
  console.log('Returned slugs:', excludeRes.slugs);
  console.log('Overlap with excluded:', overlap);
  if (overlap.length > 0) {
    throw new Error(`Found overlapping excluded slugs: ${overlap.join(', ')}`);
  }
  console.log('[PASS] Anti-repetition successfully excluded recent problems!');

  // 4. Verify that each returned random problem can be loaded by ProblemView (/api/problems/:slug)
  console.log('\n--- Testing ProblemView compatibility for random problems ---');
  for (const slug of excludeRes.slugs) {
    const pRes = await fetch(`http://localhost:5000/api/problems/${slug}`);
    if (!pRes.ok) {
      throw new Error(`Failed to fetch problem by slug: ${slug} (${pRes.status})`);
    }
    const pData = await pRes.json();
    if (!pData.title || !pData.difficulty) {
      throw new Error(`Problem ${slug} missing title or difficulty`);
    }
    console.log(`[PASS] ${slug} -> title: "${pData.title}", difficulty: ${pData.difficulty}, points: ${pData.points}`);
  }

  console.log('\n=== ALL 1v1 BATTLE RANDOM PROBLEM TESTS PASSED SUCCESSFULLY! ===');
}

runVerification().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
