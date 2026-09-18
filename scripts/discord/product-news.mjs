import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const DISCORD_MESSAGE_LIMIT = 2_000;
export const DOCS_BASE_URL = "https://docs.vapi.ai";

const CHANGELOG_PATH_PATTERN =
  /^fern\/changelog\/(\d{4})-(\d{2})-(\d{2})\.mdx$/;

export async function resolveChangelogFile(requestedPath, cwd = process.cwd()) {
  if (requestedPath) {
    const normalizedPath = requestedPath.replaceAll("\\", "/");

    if (!CHANGELOG_PATH_PATTERN.test(normalizedPath)) {
      throw new Error(
        "Changelog path must match fern/changelog/YYYY-MM-DD.mdx",
      );
    }

    return normalizedPath;
  }

  const changelogDirectory = path.join(cwd, "fern", "changelog");
  const filenames = (await readdir(changelogDirectory))
    .filter((filename) => /^\d{4}-\d{2}-\d{2}\.mdx$/.test(filename))
    .sort();

  const latestFilename = filenames.at(-1);
  if (!latestFilename) {
    throw new Error("No dated changelog files were found");
  }

  return `fern/changelog/${latestFilename}`;
}

export function buildCanonicalUrl(changelogPath) {
  const match = CHANGELOG_PATH_PATTERN.exec(changelogPath);
  if (!match) {
    throw new Error(
      "Changelog path must match fern/changelog/YYYY-MM-DD.mdx",
    );
  }

  const [, year, month, day] = match;
  return `${DOCS_BASE_URL}/whats-new/${year}/${Number(month)}/${Number(day)}`;
}

export function normalizeChangelogMarkdown(markdown) {
  let normalized = markdown.replace(/^\uFEFF/, "").trim();

  if (normalized.startsWith("---\n")) {
    const frontmatterEnd = normalized.indexOf("\n---\n", 4);
    if (frontmatterEnd === -1) {
      throw new Error("Changelog contains unterminated frontmatter");
    }
    normalized = normalized.slice(frontmatterEnd + 5).trim();
  }

  if (!/^#\s+\S/m.test(normalized)) {
    throw new Error("Changelog must contain a level-one title");
  }

  if (/<\/?[A-Z][A-Za-z0-9.]*(?:\s[^>]*)?>/.test(normalized)) {
    throw new Error(
      "Changelog contains an MDX component that needs an explicit Discord conversion",
    );
  }

  return normalized.replace(
    /(!?\[[^\]]*\]\()\/(?!\/)/g,
    `$1${DOCS_BASE_URL}/`,
  );
}

function splitOversizedBlock(block, limit) {
  const chunks = [];
  let remainder = block;

  while (remainder.length > limit) {
    let splitAt = remainder.lastIndexOf("\n", limit);
    if (splitAt < Math.floor(limit / 2)) {
      splitAt = remainder.lastIndexOf(" ", limit);
    }
    if (splitAt < Math.floor(limit / 2)) {
      splitAt = limit;
    }

    chunks.push(remainder.slice(0, splitAt).trimEnd());
    remainder = remainder.slice(splitAt).trimStart();
  }

  if (remainder) {
    chunks.push(remainder);
  }

  return chunks;
}

export function splitDiscordMessages(text, limit = DISCORD_MESSAGE_LIMIT) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Discord message limit must be a positive integer");
  }

  const blocks = text
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => splitOversizedBlock(block, limit));

  const messages = [];
  let currentMessage = "";

  for (const block of blocks) {
    const candidate = currentMessage
      ? `${currentMessage}\n\n${block}`
      : block;

    if (candidate.length <= limit) {
      currentMessage = candidate;
      continue;
    }

    if (currentMessage) {
      messages.push(currentMessage);
    }
    currentMessage = block;
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

export async function buildProductNews({
  cwd = process.cwd(),
  requestedPath,
  prefix = "",
}) {
  const changelogPath = await resolveChangelogFile(requestedPath, cwd);
  const absolutePath = path.join(cwd, changelogPath);
  const rawMarkdown = await readFile(absolutePath, "utf8");
  const markdown = normalizeChangelogMarkdown(rawMarkdown);
  const canonicalUrl = buildCanonicalUrl(changelogPath);
  const prefixBlock = prefix ? `**${prefix}**\n\n` : "";
  const completeMessage = `${prefixBlock}${markdown}\n\n**Read the full update:** ${canonicalUrl}`;

  return {
    canonicalUrl,
    changelogPath,
    messages: splitDiscordMessages(completeMessage),
  };
}

export function validateDiscordWebhookUrl(webhookUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(webhookUrl);
  } catch {
    throw new Error("Discord webhook URL is invalid");
  }

  const isDiscordHost =
    parsedUrl.hostname === "discord.com" ||
    parsedUrl.hostname.endsWith(".discord.com") ||
    parsedUrl.hostname === "discordapp.com" ||
    parsedUrl.hostname.endsWith(".discordapp.com");

  if (
    parsedUrl.protocol !== "https:" ||
    !isDiscordHost ||
    !parsedUrl.pathname.startsWith("/api/webhooks/")
  ) {
    throw new Error("Webhook must be an HTTPS Discord webhook URL");
  }

  parsedUrl.searchParams.set("wait", "true");
  return parsedUrl;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function sendWebhookMessage({
  webhookUrl,
  content,
  username,
  maxAttempts = 4,
}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        content,
        username,
      }),
    });

    if (response.ok) {
      return response.json();
    }

    const responseBody = await response.text();
    const shouldRetry = response.status === 429 || response.status >= 500;
    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(
        `Discord webhook failed with HTTP ${response.status}: ${responseBody.slice(0, 500)}`,
      );
    }

    let retryAfterMilliseconds = 1_000 * attempt;
    if (response.status === 429) {
      try {
        const rateLimit = JSON.parse(responseBody);
        retryAfterMilliseconds = Math.ceil(Number(rateLimit.retry_after) * 1_000);
      } catch {
        // Fall back to the incremental delay above.
      }
    }

    await wait(Math.min(Math.max(retryAfterMilliseconds, 250), 30_000));
  }

  throw new Error("Discord webhook failed unexpectedly");
}

export async function postProductNews({
  webhookUrl,
  messages,
  username = "Product News Bot",
}) {
  const validatedWebhookUrl = validateDiscordWebhookUrl(webhookUrl);
  const postedMessages = [];

  for (const content of messages) {
    postedMessages.push(
      await sendWebhookMessage({
        webhookUrl: validatedWebhookUrl,
        content,
        username,
      }),
    );
  }

  return postedMessages;
}
