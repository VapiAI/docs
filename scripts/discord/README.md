# Discord product-news test

This integration posts a dated `fern/changelog/YYYY-MM-DD.mdx` file to a
Discord channel through an incoming webhook. It is intentionally test-only:
there is no schedule, merge trigger, or production Discord destination.

## Local preview

```bash
node scripts/discord/post-whats-new.mjs \
  --file fern/changelog/2026-09-14.mdx \
  --prefix "[TEST]" \
  --dry-run
```

If `--file` is omitted, the latest dated changelog file is selected.

Run the tests with:

```bash
node --test scripts/discord/product-news.test.mjs
```

## GitHub test environment

1. Create a Discord incoming webhook in the personal test server.
2. In the GitHub repository, create an environment named
   `discord-product-news-test`.
3. Add the webhook URL to that environment as a secret named
   `DISCORD_WEBHOOK_URL`.
4. Merge the test workflow into the default branch. GitHub only enables
   manual `workflow_dispatch` runs for workflow files on the default branch.
5. Open **Actions → Test - Discord Product News**.
6. Run `preview` first, inspect the logs, then run `send-test`.

The script asks Discord to confirm each saved message, retries temporary API
and rate-limit failures, disables all mentions, and never prints the webhook
URL. Production scheduling and correction behavior are deliberately deferred.
