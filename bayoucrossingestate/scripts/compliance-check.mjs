// node scripts/compliance-check.mjs — fails (exit 1) if the page breaks a listing rule.
// Rules: never "master"; never "walk to"/"walking distance"; no bedroom count or square
// footage in prose (Particulars table only); no "who it's for" language.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const facts = readFileSync(new URL('../api/facts.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');

// Prose = visible text outside <table class="spec">, <script>, <style>, comments.
const prose = html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<table class="spec[\s\S]*?<\/table>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const rules = [
  ['"master" (use "primary")', /\bmaster\b/i, [prose, html, facts]],
  ['"walk to" / "walking distance"', /\bwalk(?:ing)?\s+(?:to|distance)\b|\bwalkable\b/i, [prose, html, facts]],
  ['bedroom count in prose', /\b(?:\d+|one|two|three|four|five|six|seven)[- ](?:bed(?:room)?s?|br)\b/i, [prose]],
  ['main-house square footage in prose', /\b9,?425\b|\bsq(?:uare)?\.? ?f(?:ee)?t\b/gi, [prose]],
  ['"who it\'s for" language', /\b(?:ideal|perfect|great) for (?:families|couples|retirees|kids|children|singles|professionals)\b|\bfamily[- ]friendly\b|\bexclusive neighborhood\b/i, [prose, facts]],
];

let bad = 0;
for (const [name, re, targets] of rules) {
  for (const t of targets) {
    // The adjoining tract's shop size is allowed; it is not the house.
    const m = [...t.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))]
      .find(x => !/shop/i.test(t.slice(Math.max(0, x.index - 40), x.index + 10)));
    if (m) { bad++; console.error(`FAIL ${name}: "...${t.slice(Math.max(0, m.index - 60), m.index + 60)}..."`); break; }
  }
}
if (!/Zone AE/.test(prose)) { bad++; console.error('FAIL flood status must be disclosed in the body (Zone AE)'); }
if (!/font-size:1[4-9]px[^}]*}/.test(html.match(/\.trec a\{[^}]*\}/)?.[0] || '')) { bad++; console.error('FAIL TREC links must render at 14px or larger'); }
console.log(bad ? `${bad} problem(s)` : 'compliance check passed');
process.exit(bad ? 1 : 0);
