import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const rootLayout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const analyticsComponentPath = new URL("../components/GoogleAnalytics.tsx", import.meta.url);

test("RootLayout mounts Google Analytics once for the app", () => {
  assert.match(rootLayout, /import\s+GoogleAnalytics\s+from\s+"@\/components\/GoogleAnalytics"/);
  assert.match(rootLayout, /<GoogleAnalytics\s*\/>/);
});

test("GoogleAnalytics component loads the GA4 tag with the project measurement ID", () => {
  assert.equal(existsSync(analyticsComponentPath), true);

  const source = readFileSync(analyticsComponentPath, "utf8");

  assert.match(source, /import\s+Script\s+from\s+"next\/script"/);
  assert.match(source, /G-T0EW2CPVC1/);
  assert.match(source, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{GOOGLE_ANALYTICS_ID\}/);
  assert.match(source, /window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]/);
  assert.match(source, /gtag\('config',\s*'\$\{GOOGLE_ANALYTICS_ID\}'\)/);
});
