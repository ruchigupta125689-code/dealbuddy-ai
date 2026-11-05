// Browser QA: renders pages on mobile + desktop, exercises tool flows,
// copy-to-clipboard, validation, recalculation and checks for horizontal overflow.
// Usage: BASE=http://localhost:3100 OUT=/tmp/shots node tests/e2e/browser.test.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "/tmp/shots";
mkdirSync(OUT, { recursive: true });
let passed = 0;
let failed = 0;
const check = (cond, name) => {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
};

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const ctx = browser.defaultBrowserContext();
await ctx.overridePermissions(BASE, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);

const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const TABLET = { width: 820, height: 1180, deviceScaleFactor: 1 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };

async function open(path, viewport) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/favicon|Download the React DevTools/.test(m.text()) && errors.push(m.text()));
  await page.setViewport(viewport);
  await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 60000 });
  return { page, errors };
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const clickText = (page, text, sel = "button, a") =>
  page.evaluate(
    (text, sel) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(text));
      if (!el) return false;
      el.click();
      return true;
    },
    text,
    sel,
  );
const waitText = (page, text, timeout = 20000) =>
  page.waitForFunction((t) => document.body.textContent.toLowerCase().includes(t.toLowerCase()), { timeout }, text).then(
    () => true,
    () => false,
  );

console.log("\nBrowser QA");

// 1. Static pages on three viewports
for (const [vpName, vp] of [["mobile", MOBILE], ["tablet", TABLET], ["desktop", DESKTOP]]) {
  for (const path of ["/", "/dashboard", "/pricing", "/login", "/tools/reply", "/tools/rate-calculator", "/privacy", "/account"]) {
    const { page, errors } = await open(path, vp);
    check(await noOverflow(page), `${vpName} ${path}: no horizontal overflow`);
    check(errors.length === 0, `${vpName} ${path}: no console errors${errors.length ? " — " + errors[0].slice(0, 120) : ""}`);
    if ((vpName === "mobile" || vpName === "desktop") && ["/", "/dashboard", "/pricing"].includes(path)) {
      await page.screenshot({ path: `${OUT}/${vpName}-${path === "/" ? "home" : path.slice(1)}.png`, fullPage: true });
    }
    await page.close();
  }
}

// 2. Dashboard content
{
  const { page } = await open("/dashboard", MOBILE);
  const text = await page.evaluate(() => document.body.innerText);
  for (const t of ["Welcome to DealBuddy", "Let's make your next brand collaboration smarter.", "Reply to a Brand", "Negotiate a Deal", "Check a Brand Deal", "Create a Brand Pitch", "Calculate My Rate", "AI generations remaining", "Upgrade plan"]) {
    check(text.includes(t), `dashboard shows “${t}”`);
  }
  await page.close();
}

// 3. Reply tool: empty submit, example, generate, copy, edit, refine
{
  const { page, errors } = await open("/tools/reply", MOBILE);
  await clickText(page, "Write my reply");
  check(await waitText(page, "Paste the brand's email", 5000), "reply: empty submission shows validation error");
  await clickText(page, "Fill with an example");
  await clickText(page, "Write my reply");
  check(await waitText(page, "Your reply"), "reply: result renders");
  await page.screenshot({ path: `${OUT}/mobile-tool-reply-result.png`, fullPage: true });
  await clickText(page, "Copy all");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.startsWith("Subject: Re: Collaboration with Glowmint"), "reply: copy-all puts subject + body on clipboard");
  await clickText(page, "Edit");
  await page.waitForSelector("textarea[aria-label='Your reply text']");
  await page.evaluate(() => {
    const ta = document.querySelector("textarea[aria-label='Your reply text']");
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(ta, ta.value + "\nP.S. EDITED-BY-TEST");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await clickText(page, "Done");
  await clickText(page, "Copy all");
  const clip2 = await page.evaluate(() => navigator.clipboard.readText());
  check(clip2.includes("EDITED-BY-TEST"), "reply: edits are reflected in copied text");
  check(await clickText(page, "Make it shorter"), "reply: 'Make it shorter' button present");
  check(await waitText(page, "Your reply"), "reply: refinement returns a result");
  check(errors.length === 0, "reply: no console errors");
  await page.close();
}

// 4. Negotiate, risk, pitch flows (desktop + mobile screenshots)
for (const [path, button, expect, shot] of [
  ["/tools/negotiate", "Assess this offer", "Suggested counteroffer", "negotiate"],
  ["/tools/risk-check", "Check these terms", "Term-by-term review", "risk"],
  ["/tools/pitch", "Write my pitch", "Instagram DM", "pitch"],
]) {
  for (const [vpName, vp] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
    const { page, errors } = await open(path, vp);
    await clickText(page, button);
    const sawError = await page.evaluate(() => !!document.querySelector("[role=alert]"));
    check(sawError, `${shot} ${vpName}: empty submit shows field errors`);
    await clickText(page, "Fill with an example");
    await clickText(page, button);
    check(await waitText(page, expect), `${shot} ${vpName}: result renders (“${expect}”)`);
    check(await noOverflow(page), `${shot} ${vpName}: result has no horizontal overflow`);
    check(errors.length === 0, `${shot} ${vpName}: no console errors`);
    await page.screenshot({ path: `${OUT}/${vpName}-tool-${shot}-result.png`, fullPage: true });
    await page.close();
  }
}

// 5. Rate calculator: live estimate, edit assumptions, recalc, AI message
{
  const { page, errors } = await open("/tools/rate-calculator", DESKTOP);
  await clickText(page, "Fill with an example");
  check(await waitText(page, "Indicative range", 5000), "rate: estimate appears instantly (no AI)");
  const before = await page.evaluate(() => document.body.textContent.match(/Suggested starting quote\s*(₹[\d,]+)/)?.[1]);
  await clickText(page, "Edit pricing assumptions");
  await page.waitForSelector("#a-high");
  await page.focus("#a-high");
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("2400");
  await new Promise((r) => setTimeout(r, 300));
  const after = await page.evaluate(() => document.body.textContent.match(/Suggested starting quote\s*(₹[\d,]+)/)?.[1]);
  check(before && after && before !== after, `rate: editing assumptions recalculates (${before} → ${after})`);
  check(await waitText(page, "Custom", 2000), "rate: custom assumptions are labelled");
  await clickText(page, "Write quote message");
  check(await waitText(page, "Quote message"), "rate: AI quote message renders");
  await page.screenshot({ path: `${OUT}/desktop-tool-rate-result.png`, fullPage: true });
  check(errors.length === 0, "rate: no console errors");
  await page.close();

  const m = await open("/tools/rate-calculator", MOBILE);
  await clickText(m.page, "Fill with an example");
  await waitText(m.page, "Indicative range", 5000);
  await m.page.screenshot({ path: `${OUT}/mobile-tool-rate.png`, fullPage: true });
  check(await noOverflow(m.page), "rate mobile: no horizontal overflow");
  await m.page.close();
}

// 6. Mobile menu
{
  const { page } = await open("/", MOBILE);
  await page.click("button[aria-label='Open menu']");
  check(await waitText(page, "How it works", 2000), "mobile nav menu opens");
  await page.close();
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed) process.exitCode = 1;
