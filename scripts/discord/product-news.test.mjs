import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCanonicalUrl,
  DISCORD_MESSAGE_LIMIT,
  normalizeChangelogMarkdown,
  splitDiscordMessages,
  validateDiscordWebhookUrl,
} from "./product-news.mjs";

test("builds the public URL from a dated changelog path", () => {
  assert.equal(
    buildCanonicalUrl("fern/changelog/2026-09-07.mdx"),
    "https://docs.vapi.ai/whats-new/2026/9/7",
  );
});

test("converts root-relative docs links for Discord", () => {
  const markdown = normalizeChangelogMarkdown(`
# What's New

Read the [simulations guide](/observability/simulations-overview).
  `);

  assert.match(
    markdown,
    /\[simulations guide\]\(https:\/\/docs\.vapi\.ai\/observability\/simulations-overview\)/,
  );
});

test("rejects MDX components instead of posting broken markup", () => {
  assert.throws(
    () => normalizeChangelogMarkdown("# What's New\n\n<Note>News</Note>"),
    /MDX component/,
  );
});

test("splits long updates within Discord's content limit", () => {
  const paragraphs = Array.from(
    { length: 20 },
    (_, index) => `${index + 1}. ${"Product update ".repeat(20)}`,
  );
  const messages = splitDiscordMessages(paragraphs.join("\n\n"));

  assert.ok(messages.length > 1);
  assert.ok(
    messages.every((message) => message.length <= DISCORD_MESSAGE_LIMIT),
  );
  assert.match(messages.at(-1), /20\./);
});

test("accepts only Discord HTTPS webhook URLs", () => {
  assert.equal(
    validateDiscordWebhookUrl(
      "https://discord.com/api/webhooks/123/example-token",
    ).searchParams.get("wait"),
    "true",
  );
  assert.throws(
    () => validateDiscordWebhookUrl("https://example.com/api/webhooks/123/token"),
    /Discord webhook/,
  );
});
