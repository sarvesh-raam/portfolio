# Sarvesh Raam - Portfolio Website

Live: https://sarvesh-raam.github.io/portfolio/

A minimal portfolio showcasing AI engineering work. Plain HTML, CSS and JavaScript on GitHub Pages; no build step.

---

## How the content works

All editable content lives in `data/` as JSON. The page (`script.js`) loads these files and builds each section, so changing a value there changes the site.

| File | What it controls |
|---|---|
| `data/profile.json` | CGPA, education, About text, hero "I build …" phrases, profile card |
| `data/projects.json` | All projects. `featured: true` = big card in **Projects**; `false` = row in **More Projects**; `visible: false` = hidden |
| `data/experience.json` | Internships. Months are calculated from `start` / `end` (empty `end` = current role) |
| `data/certifications.json` | Certification cards |
| `data/achievements.json` | Achievements timeline. `{{leetcode.total}}`, `{{leetcode.medium}}` etc. insert live numbers |
| `data/building.json` | Currently Building cards |
| `data/stats.json` | **Generated** — live LeetCode and GitHub numbers. Don't edit by hand |

Hero numbers are derived: internships = visible experience entries, projects = visible projects, LeetCode = `stats.json`.

## Editing from the browser (admin page)

Open **https://sarvesh-raam.github.io/portfolio/admin/** (works on a phone too).

1. One-time: create a GitHub token at *GitHub → Settings → Developer settings → Fine-grained tokens*.
   Repository access: **only `sarvesh-raam/portfolio`**. Permissions: **Contents → Read and write**.
2. On the admin page choose **Sign In Using Access Token** and paste it.
3. Edit, then **Save**. Each save is a commit to `main`; GitHub Pages republishes in about a minute.

The admin page is [Sveltia CMS](https://github.com/sveltia/sveltia-cms); its forms are defined in `admin/config.yml`.

## Live stats

`.github/workflows/update-stats.yml` runs `scripts/update-stats.mjs` every 6 hours. It reads your LeetCode and GitHub numbers server-side, writes `data/stats.json` only if something changed, commits it, and asks Pages to rebuild.
For an instant refresh: *Actions → Update live stats → Run workflow*.

## Running locally

The page fetches `data/*.json`, so open it through a local server (not by double-clicking the file):

```bash
python -m http.server 3000
```

Then visit `http://localhost:3000`.

## Repository structure

```text
portfolio/
├── index.html                       # Page structure; sections are filled from data/
├── style.css                        # Design tokens and styles
├── script.js                        # Loads data/, renders sections, animations
├── data/                            # Editable content (JSON)
├── admin/                           # Browser admin page (Sveltia CMS) + config.yml
├── scripts/update-stats.mjs         # Fetches live LeetCode/GitHub numbers
└── .github/workflows/update-stats.yml
```
