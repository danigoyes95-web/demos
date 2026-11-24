# Search profile: Daniel Goyes M.

## Goal
Land a remote job (employee or freelance/contract) as fast as possible. The agent runs daily until Daniel says he is hired.

## Target roles (priority order)
1. **Tier A (strong fit):** Product Manager / Technical PM / Associate PM, Growth or Marketing Manager, Product Marketing, Marketing Operations / RevOps, Business Development, Partnerships, Customer Success / Account Management (B2B), Solutions Consultant / Solutions Engineer (junior to mid), Marketing Technologist, Financial / Business Analyst (junior to mid).
2. **Tier B (reach, only if the posting is junior-friendly):** Analytics Engineer / BI, Solutions Architect (associate), Front-end or Full-stack (JavaScript/Supabase stack), Data Analyst.
3. **Tier C (skip unless the posting explicitly welcomes self-taught builders with a portfolio):** Data Engineer, Senior Software Engineer.

## Hard constraints
- Remote: any country and any time zone. In person only in Ecuador.
- Minimum pay: USD 1,000 per month (about USD 6 per hour for contract work). If the posting hides pay, keep it but flag "pay unknown".
- Languages: English (advanced), Spanish (native). Postings requiring other languages: skip.
- Employee or freelance/contract are both fine.
- Skip a posting if it restricts remote work to specific countries and Ecuador/LatAm/Global is not included (flag "geo-restricted" in the summary count, don't list).
- Skip roles that require a security clearance or US citizenship.

## Positioning (what to lead with)
- 33r (own studio) as main experience: builds two-sided systems (customer experience + owner dashboard) with Supabase/PostgreSQL, PWA, Next.js/Astro, GA4.
- NutriBites second: B2B sales, costing, automation.
- Marketing/sales background (Movistar, Ecudental, Licores Don Guido) is the proof of commercial depth.
- Honest framing: AI-assisted development is part of the process. Never claim formal software-engineering employment or degrees that are not in the master CV.

## Rules for the agent
1. Never invent experience, numbers, titles, tools or dates. Tailoring = reorder, trim, re-word from `cv/master_en.md`.
2. **Never submit an application without Daniel's explicit approval.** Prepare everything, stop before the final submit/send.
3. Don't name Geriam or any provincial-government client.
4. Never put phone or email in committed files. Contact details are in `contact.local.md` (gitignored).
5. Quality over quantity: prefer 3-5 well-tailored applications per day over 30 generic ones.
6. Don't use LinkedIn/Indeed/Upwork automation (account bans). For those, list the job and let Daniel apply by hand.
7. Dedupe against `tracker/applications.csv` (by job link and by company+title).

## Daily email summary format
Subject: `Job agent: N new matches (top: <title> at <company>)`
Body: top 5 by score, each with title, company, pay, remote scope, link, 1-line fit reason, and what is prepared (tailored CV / cover note). Then "Needs your OK" list, then stats (searched, filtered, geo-restricted).
