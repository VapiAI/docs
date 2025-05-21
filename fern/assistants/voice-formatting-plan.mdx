---
title: Voice formatting plan
subtitle: Format LLM output for natural-sounding speech
slug: assistants/voice-formatting-plan
---

## Overview

Voice formatting automatically transforms raw text from your language model (LLM) into a format that sounds natural when spoken by a text-to-speech (TTS) provider. This process—called **Voice Input Formatted**—is enabled by default for all assistants.

Formatting helps with things like:

- Expanding numbers and currency (e.g., `$42.50` → "forty two dollars and fifty cents")
- Expanding abbreviations (e.g., `ST` → "STREET")
- Spacing out phone numbers (e.g., `123-456-7890` → "1 2 3 4 5 6 7 8 9 0")

You can turn off formatting if you want the TTS to read the raw LLM output.

## How voice input formatting works

When enabled, the formatter runs a series of transformations on your text, each handled by a specific function. Here's the order and what each function does:

| **Step** | **Function Name** | **Description** | **Before** | **After** | **Default** | **Precedence** |
| :------- | :---------------- | :-------------- | :--------- | :-------- | :---------- | :------------ |
| 1 | `removeAngleBracketContent` | Removes anything within `<...>`, except for `<break>`, `<spell>`, or double angle brackets `<< >>`. | `Hello <tag> world` | `Hello  world` | ✅ | - |
| 2 | `removeMarkdownSymbols` | Removes markdown symbols like `_`, `` ` ``, and `~`. Asterisks (`*`) are preserved in this step. | `**Wanted** to say *hi*` | `**Wanted** to say *hi*` | ✅ | 0 |
| 3 | `removePhrasesInAsterisks` | Removes text surrounded by single or double asterisks. | `**Wanted** to say *hi*` | ` to say` | ❌ | 0 |
| 4 | `replaceNewLinesWithPeriods` | Converts new lines (`\n`) to periods for smoother speech. | `Hello  world\n to say\nWe have NASA` | `Hello  world .  to say . We have NASA` | ✅ | 0 |
| 5 | `replaceColonsWithPeriods` | Replaces `:` with `.` for better phrasing. | `price: $42.50` | `price. $42.50` | ✅ | 0 |
| 6 | `formatAcronyms` | Converts known acronyms to lowercase (e.g., NASA → nasa) or spaces out unknown all-caps words unless they contain vowels. | `NASA and .NET` | `nasa and .net` | ✅ | 0 |
| 7 | `formatDollarAmounts` | Converts currency amounts to spoken words. | `$42.50` | `forty two dollars and fifty cents` | ✅ | 0 |
| 8 | `formatEmails` | Replaces `@` with "at" and `.` with "dot" in emails. | `JOHN.DOE@example.COM` | `JOHN dot DOE at example dot COM` | ✅ | 0 |
| 9 | `formatDates` | Converts date strings into spoken date format. | `2023 05 10` | `Wednesday, May 10, 2023` | ✅ | 0 |
| 10 | `formatTimes` | Expands or simplifies time expressions. | `14:00` | `14` | ✅ | 0 |
| 11 | `formatDistances`, `formatUnits`, `formatPercentages`, `formatPhoneNumbers` | Converts units, distances, percentages, and phone numbers into spoken words. | `5km`, `43 lb`, `50%`, `123-456-7890` | `5 kilometers`, `forty three pounds`, `50 percent`, `1 2 3 4 5 6 7 8 9 0` | ✅ | 0 |
| 12 | `formatNumbers` | Formats general numbers: years read as digits, large numbers spelled out, negative and decimal numbers clarified. | `-9`, `2.5`, `2023` | `minus nine`, `two point five`, `2023` | ✅ | 0 |
| 13 | `removeAsterisks` | Removes all asterisk characters from the text. | `**Bold** and *italic*` | `Bold and italic` | ✅ | 1 |
| 14 | `Applying Replacements` | Applies user-defined final replacements like expanding street abbreviations. | `320 ST 21 RD` | `320 STREET 21 ROAD` | ✅ | - |

---

## Customizing the formatting plan

You can control some aspects of formatting:

### Enabled
Formatting is on by default. To disable, set:
```js
voice.chunkPlan.formatPlan.enabled = false
```

### Number-to-digits cutoff
Controls when numbers are read as digits instead of words.
- **Default:** `2025` (current year)
- Example: With a cutoff of `2025`, numbers above this are read as digits.
- To spell out larger numbers, set the cutoff higher (e.g., `300000`).

### Replacements
Add exact or regex-based substitutions to customize output.
- **Example 1:** Replace `hello` with `hi`:
  ```js
  { type: 'exact', key: 'hello', value: 'hi' }
  ```
- **Example 2:** Replace words matching a pattern:
  ```js
  { type: 'regex', regex: '\b[a-zA-Z]{5}\b', value: 'hi' }
  ```

<Note>
Currently, only replacements and the number-to-digits cutoff are customizable. Other options are not exposed.
</Note>

---

## Turning formatting off

To disable all formatting and use raw LLM output, set either of these to `false`:

```js
voice.chunkPlan.enabled = false
// or
voice.chunkPlan.formatPlan.enabled = false
```

---

## Summary

- Voice input formatting improves clarity and naturalness for TTS.
- Each transformation step targets a specific pattern for better speech output.
- You can customize or disable formatting as needed.
