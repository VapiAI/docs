#!/usr/bin/env node

import { buildProductNews, postProductNews } from "./product-news.mjs";

function parseArguments(arguments_) {
  const options = {
    dryRun: false,
    prefix: "",
    requestedPath: "",
    username: "Product News Bot",
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (["--file", "--prefix", "--username"].includes(argument)) {
      const value = arguments_[index + 1];
      if (!value) {
        throw new Error(`${argument} requires a value`);
      }
      index += 1;

      if (argument === "--file") options.requestedPath = value;
      if (argument === "--prefix") options.prefix = value;
      if (argument === "--username") options.username = value;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const productNews = await buildProductNews({
    prefix: options.prefix,
    requestedPath: options.requestedPath,
  });

  console.log(`Source: ${productNews.changelogPath}`);
  console.log(`Docs: ${productNews.canonicalUrl}`);
  console.log(`Discord messages: ${productNews.messages.length}`);

  if (options.dryRun) {
    productNews.messages.forEach((message, index) => {
      console.log(`\n--- Message ${index + 1}/${productNews.messages.length} ---\n`);
      console.log(message);
    });
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL is required unless --dry-run is used");
  }

  const postedMessages = await postProductNews({
    webhookUrl,
    messages: productNews.messages,
    username: options.username,
  });

  console.log(`Posted ${postedMessages.length} Discord message(s) successfully.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
