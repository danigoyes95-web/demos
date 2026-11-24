# Daily routine (run every morning until Daniel says he is hired)

Read first: `profile.md` (goal, constraints, rules), `cv/master_en.md` (only source of CV facts), `companies.yaml`, `tracker/applications.csv`.

## Steps
1. **Search.** Run `python3 tools/search_jsearch.py --max-queries 6`. It makes 6 JSearch requests (free plan is capped monthly: never loop or re-run it the same day). Results: `output/candidates.json`.
   - Also check 3-5 target companies per day from `companies.yaml` (rotate): use WebSearch for "<company> careers remote <tier A role>", and public ATS endpoints (greenhouse/lever/ashby) if the host is reachable. Record the detected `ats` in companies.yaml.
2. **Judge.** The script's score is only a first pass. Read each top candidate's description yourself and keep only real fits: tier A/B role, remote from Ecuador or global/LatAm, pay >= USD 1,000/month or unknown, not senior-only. Drop geo-restricted ones.
3. **Prepare (top 3-5 only).** For each: save a tailored CV to `output/<date>/<company>-<role>/cv.md` (reorder and re-word `master_en.md`; never invent; remove `[ADD METRIC]`/`[TBC]` lines) and a short cover note (5-7 sentences, specific to the company, honest about AI-assisted development). Do NOT submit anything. Do NOT fill in phone/email in committed files.
4. **Track.** Append rows to `tracker/applications.csv` with status `prepared` (or `listed` for manual-only boards).
5. **Email summary** (this session's final message is the email body), format in `profile.md`. Be short. End with: "Reply with which ones to send."
6. **Persist.** `git add job-agent && git commit` and push to branch `claude/kind-meitner-f1waob` (tracker + companies updates only; `output/` and contact data are gitignored).

## When Daniel approves one
Open a live session: fill the form (Playwright is preinstalled), attach the tailored CV, stop at the final button, show a screenshot, and submit only after a second explicit "send".
