// Fill (and optionally submit) Enumerate "Product Owner, AI Pod" on Greenhouse.
// Usage: node apply_enumerate.js <cv.pdf> <screenshot.png> [--submit]
// Reads contact from contact.local.md (gitignored). Without --submit it NEVER clicks submit.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const [cv, shot] = process.argv.slice(2); const SUBMIT = process.argv.includes('--submit');
const c = Object.fromEntries(fs.readFileSync(path.join(__dirname,'..','contact.local.md'),'utf8').split('\n').filter(Boolean).map(l=>{const i=l.indexOf(':');return [l.slice(0,i).trim(),l.slice(i+1).trim()]}));
const pick = async (p, id, text) => { await p.click('#'+id); await p.keyboard.type(text); await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(400); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1100,height:1500}});
  await p.goto('https://job-boards.greenhouse.io/enumerate/jobs/4510374009',{timeout:60000,waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
  await p.fill('#first_name','Daniel'); await p.fill('#last_name','Goyes M.'); await p.fill('#email',c.Email);
  await pick(p,'country','Ecuador'); await p.fill('#phone', c.Phone.replace(/^\+593\s*/,''));
  await p.setInputFiles('#resume', cv); await p.waitForTimeout(3000);
  await p.fill('#question_8544645009', c.LinkedIn); await p.fill('#question_8544646009', c.Portfolio);
  await pick(p,'question_8544647009','Yes');            // processing of personal data (needed to apply)
  await p.fill('#question_8544650009','Ecuador');
  await pick(p,'question_8611655009','$2500-3500');
  // retention (…8544648009) and marketing updates (…8544649009): left for Daniel to decide
  await p.screenshot({path: shot, fullPage: true});
  const errs = await p.$$eval('[class*=error],[role=alert]', e=>e.map(x=>x.innerText).filter(Boolean));
  console.log('filled; visible errors:', errs.slice(0,5));
  if (SUBMIT) { await p.click('button:has-text("Submit application")'); await p.waitForTimeout(6000); await p.screenshot({path: shot.replace('.png','_after.png'), fullPage:true}); console.log('SUBMITTED; page text:', (await p.innerText('body')).replace(/\s+/g,' ').slice(0,300)); }
  await b.close();
})();
