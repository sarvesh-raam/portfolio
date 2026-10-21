// Fetches live LeetCode + GitHub numbers and writes data/stats.json.
// Run by .github/workflows/update-stats.yml (server-side, so LeetCode's CORS block doesn't apply).
// Exits without touching the file if a source fails, so the site keeps the last good numbers.

import { readFile, writeFile } from 'node:fs/promises';

const STATS_FILE = new URL('../data/stats.json', import.meta.url);
const PROFILE_FILE = new URL('../data/profile.json', import.meta.url);
const GITHUB_USER = 'sarvesh-raam';

async function leetcode(handle) {
    const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
            'User-Agent': 'Mozilla/5.0 (portfolio stats bot)',
        },
        body: JSON.stringify({
            query: `query ($u: String!) {
                matchedUser(username: $u) {
                    submitStatsGlobal { acSubmissionNum { difficulty count } }
                    profile { ranking }
                }
            }`,
            variables: { u: handle },
        }),
    });
    if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
    const user = (await res.json())?.data?.matchedUser;
    if (!user) throw new Error('LeetCode user not found');
    const counts = Object.fromEntries(user.submitStatsGlobal.acSubmissionNum.map(r => [r.difficulty, r.count]));
    return {
        total: counts.All,
        easy: counts.Easy,
        medium: counts.Medium,
        hard: counts.Hard,
        ranking: user.profile?.ranking ?? null,
    };
}

async function github(user) {
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-stats' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/users/${user}`, { headers });
    if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
    const data = await res.json();
    return { publicRepos: data.public_repos, followers: data.followers };
}

const profile = JSON.parse(await readFile(PROFILE_FILE, 'utf8'));
const previous = JSON.parse(await readFile(STATS_FILE, 'utf8'));

const next = { ...previous };
try {
    next.leetcode = await leetcode(profile.leetcodeHandle);
} catch (e) {
    console.warn('Keeping previous LeetCode numbers:', e.message);
}
try {
    next.github = await github(GITHUB_USER);
} catch (e) {
    console.warn('Keeping previous GitHub numbers:', e.message);
}

// Only write (and therefore only commit) when a number actually changed
const changed = JSON.stringify(next.leetcode) !== JSON.stringify(previous.leetcode)
    || JSON.stringify(next.github) !== JSON.stringify(previous.github);

if (changed) {
    next.updatedAt = new Date().toISOString();
    await writeFile(STATS_FILE, JSON.stringify(next, null, 2) + '\n');
    console.log('Updated stats:', next);
} else {
    console.log('No change:', next);
}
