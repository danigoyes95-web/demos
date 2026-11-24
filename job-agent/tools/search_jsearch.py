#!/usr/bin/env python3
"""Daily job search via JSearch (RapidAPI, endpoint /search-v2).

The API key is injected by the environment's network proxy, so NO key is read or sent here.
Uses curl through the already-configured proxy. Free plan has a monthly request cap, so each run
makes at most MAX_QUERIES requests (rotating through the query list by date).

Usage: python3 search_jsearch.py [--max-queries 6] [--out output/candidates.json]
Writes candidates (new, not in tracker/seen) sorted by score, plus run stats.
"""
import argparse, csv, datetime as dt, json, re, subprocess, sys, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOST = "jsearch.p.rapidapi.com"

# Query list rotates by day-of-year. Remote-only (work_from_home=true).
QUERIES = [
    "product manager remote", "associate product manager remote", "technical product manager remote",
    "growth marketing manager remote", "product marketing manager remote", "marketing operations manager remote",
    "revenue operations analyst remote", "business development representative remote", "partnerships manager remote",
    "customer success manager remote", "account manager b2b remote", "solutions consultant remote",
    "solutions engineer remote junior", "marketing technologist remote", "business analyst remote",
    "financial analyst remote", "analytics engineer remote junior", "data analyst remote junior",
    "ecommerce manager remote", "crm manager remote", "latin america remote marketing",
    "latam remote product manager", "freelance marketing strategist remote", "freelance web developer supabase",
    "frontend developer javascript remote junior", "no-code automation specialist remote",
]

TIER_A = r"product manager|product owner|growth|marketing manager|product marketing|marketing operations|revops|revenue operations|business development|partnership|customer success|account (manager|executive)|solutions (consultant|engineer)|marketing technologist|business analyst|financial analyst|crm|ecommerce|e-commerce|automation"
TIER_B = r"analytics engineer|data analyst|bi analyst|solutions architect|front-?end|full-?stack|web developer|supabase"
TIER_C = r"data engineer|staff|principal|director|vp |head of|senior software|machine learning|devops|sre"
HARD_NO = r"security clearance|clearance required|u\.?s\.? citizen|must be a us citizen|ts/sci|secret clearance"
GEO_RESTRICT = r"(must|need to) (reside|be located|live) in (the )?(us|u\.s\.|united states|canada|uk|europe|eu)|us[- ]based only|(authorized|eligible) to work in the (us|united states)|work authorization (in|for) the (us|united states)"
LATAM_OK = r"latin america|latam|worldwide|anywhere in the world|work from anywhere|ecuador|any (country|location)"
US_ONLY_TITLE = r"\((us|u\.s\.|usa|united states|canada|uk)[^)]*\)|\b(us|usa) remote\b|\bus[- ]based\b|100% remote \((?:[A-Z]{2},? ?)+\)|\b(remote|hybrid)\s*[-,]\s*(us|usa)\b"


def monthly_usd(job):
    lo, per = job.get("job_min_salary"), (job.get("job_salary_period") or "").upper()
    if not lo:
        return None
    mult = {"YEAR": 1 / 12, "MONTH": 1, "WEEK": 4.33, "DAY": 21.7, "HOUR": 160}.get(per)
    return lo * mult if mult else None


def curl_search(query, page_cursor=None):
    params = {"query": query, "work_from_home": "true", "num_pages": "1"}
    url = f"https://{HOST}/search-v2?" + urllib.parse.urlencode(params)
    r = subprocess.run(["curl", "-s", "-m", "60", url, "-H", f"x-rapidapi-host: {HOST}"],
                       capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
    except Exception:
        return None, f"bad response: {r.stdout[:200]!r}"
    if d.get("status") != "OK":
        return None, d.get("message") or str(d)[:200]
    return d["data"]["jobs"], None


def load_seen():
    seen = set()
    p = ROOT / "tracker" / "applications.csv"
    if p.exists():
        with p.open(newline="") as f:
            for row in csv.DictReader(f):
                seen.add(row["job_id"])
                seen.add((row["company"].lower(), row["title"].lower()))
    sp = ROOT / "tracker" / "seen_jobs.json"
    if sp.exists():
        seen |= set(json.loads(sp.read_text()))
    return seen, sp


def target_companies():
    txt = (ROOT / "companies.yaml").read_text()
    return [m.lower() for m in re.findall(r"name: ([^,}]+)", txt)]


def score(job, targets):
    title = (job.get("job_title") or "")
    desc = (job.get("job_description") or "")
    company = (job.get("employer_name") or "")
    s, notes = 0, []
    if re.search(TIER_A, title, re.I): s += 50; notes.append("tier A title")
    elif re.search(TIER_B, title, re.I): s += 30; notes.append("tier B title")
    if re.search(TIER_C, title, re.I): s -= 30; notes.append("senior/tier C signal")
    if job.get("job_is_remote"): s += 10
    if re.search(US_ONLY_TITLE, title, re.I) and not re.search(LATAM_OK, title + " " + desc[:2000], re.I): s -= 45; notes.append("US-only in title")
    if any(t and (t in company.lower() or company.lower() in t) for t in targets): s += 25; notes.append("TARGET COMPANY")
    if re.search(LATAM_OK, desc[:3000], re.I): s += 10; notes.append("LatAm/global mention")
    pay = monthly_usd(job)
    if pay is not None:
        if pay < 1000: s -= 40; notes.append(f"pay ~${pay:,.0f}/mo below floor")
        else: notes.append(f"pay ~${pay:,.0f}/mo")
    else:
        notes.append("pay unknown")
    if re.search(r"junior|associate|entry|early[- ]career|trainee", title, re.I): s += 5
    return s, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-queries", type=int, default=6)
    ap.add_argument("--out", default=str(ROOT / "output" / "candidates.json"))
    a = ap.parse_args()

    seen, seen_path = load_seen()
    targets = target_companies()
    day = dt.date.today().timetuple().tm_yday
    qs = [QUERIES[(day * a.max_queries + i) % len(QUERIES)] for i in range(a.max_queries)]

    stats = {"date": dt.date.today().isoformat(), "queries": qs, "requests": 0, "raw": 0,
             "dupes": 0, "hard_no": 0, "geo_restricted": 0, "below_pay_floor": 0, "errors": []}
    cands, ids = {}, set()
    for q in qs:
        jobs, err = curl_search(q)
        stats["requests"] += 1
        if err:
            stats["errors"].append({q: err}); continue
        for j in jobs:
            stats["raw"] += 1
            jid = j.get("job_id")
            key = ((j.get("employer_name") or "").lower(), (j.get("job_title") or "").lower())
            if jid in seen or key in seen or jid in ids:
                stats["dupes"] += 1; continue
            blob = (j.get("job_title") or "") + " " + (j.get("job_description") or "")
            if re.search(HARD_NO, blob, re.I):
                stats["hard_no"] += 1; continue
            if re.search(GEO_RESTRICT, blob, re.I) and not re.search(LATAM_OK, blob, re.I):
                stats["geo_restricted"] += 1; continue
            sc, notes = score(j, targets)
            pay = monthly_usd(j)
            if pay is not None and pay < 1000:
                stats["below_pay_floor"] += 1; continue
            ids.add(jid)
            cands[jid] = {
                "job_id": jid, "score": sc, "notes": notes, "title": j.get("job_title"),
                "company": j.get("employer_name"), "location": j.get("job_location"),
                "type": j.get("job_employment_type"), "pay": j.get("job_salary_string") or j.get("job_salary"),
                "posted": j.get("job_posted_at"), "publisher": j.get("job_publisher"),
                "apply_link": j.get("job_apply_link"), "direct_apply": j.get("job_apply_is_direct"),
                "description": (j.get("job_description") or "")[:6000],
            }
    out = sorted(cands.values(), key=lambda c: -c["score"])
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps({"stats": stats, "candidates": out}, ensure_ascii=False, indent=2))
    seen_path.write_text(json.dumps(sorted(x for x in seen if isinstance(x, str)) + sorted(ids)))
    print(json.dumps(stats, ensure_ascii=False))
    for c in out[:10]:
        print(f"{c['score']:>4} | {c['title']} | {c['company']} | {c['pay'] or 'pay ?'} | {', '.join(c['notes'])}")


if __name__ == "__main__":
    sys.exit(main())
