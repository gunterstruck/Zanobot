#!/usr/bin/env node
/**
 * Translation Consistency Checker
 * Validates that all language files have identical structure
 *
 * Supports both expanded and compact (inline) object notation
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '../src/i18n/locales');

/**
 * Extract all key paths from a TypeScript translation file.
 *
 * Uses a character-by-character state machine to correctly handle:
 * - Expanded notation (one key per line)
 * - Compact notation (multiple keys per line)
 * - Inline objects: key: { a: 'x', b: 'y' }
 * - Multi-line string values (value starts on the next line)
 * - Escaped quotes inside strings
 * - Quoted numeric keys like '0': { ... }
 */
function extractKeyPaths(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Remove block comments
  const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract the object content between the top-level braces
  const match = cleaned.match(/export const \w+:\s*TranslationDict\s*=\s*\{([\s\S]*)\};/);
  if (!match) {
    throw new Error('Could not find TranslationDict export');
  }

  const src = match[1];
  const keys = new Set();
  const path = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    // Skip whitespace and commas
    while (i < len && /[\s,]/.test(src[i])) i++;
    if (i >= len) break;

    const ch = src[i];

    // Skip single-line comments
    if (ch === '/' && i + 1 < len && src[i + 1] === '/') {
      while (i < len && src[i] !== '\n') i++;
      continue;
    }

    // Closing brace → pop one nesting level
    if (ch === '}') {
      if (path.length > 0) path.pop();
      i++;
      continue;
    }

    // Try to match a key (unquoted or quoted) followed by a colon
    const remaining = src.slice(i);
    const keyMatch = remaining.match(/^(?:'(\w+)'|"(\w+)"|(\w+))\s*:/);
    if (!keyMatch) {
      // Not a recognisable key – skip character
      i++;
      continue;
    }

    const key = keyMatch[1] || keyMatch[2] || keyMatch[3];
    i += keyMatch[0].length;

    // Skip whitespace after the colon (including newlines for multi-line values)
    while (i < len && /\s/.test(src[i])) i++;
    if (i >= len) break;

    if (src[i] === '{') {
      // Nested object – push key and descend
      path.push(key);
      i++; // skip '{'
    } else if (src[i] === "'" || src[i] === '"' || src[i] === '`') {
      // String value – consume until matching closing quote
      const quote = src[i];
      i++; // skip opening quote
      while (i < len) {
        if (src[i] === '\\') {
          i += 2; // skip escaped character
        } else if (src[i] === quote) {
          i++; // skip closing quote
          break;
        } else {
          i++;
        }
      }
      const fullPath = path.length > 0 ? [...path, key].join('.') : key;
      keys.add(fullPath);
    } else {
      // Non-string value (number, boolean, identifier, etc.) – skip to next delimiter
      while (i < len && src[i] !== ',' && src[i] !== '}' && src[i] !== '\n') i++;
    }
  }

  return Array.from(keys).sort();
}

/**
 * Main consistency check
 */
function main() {
  const languages = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    zh: 'Chinese'
  };

  console.log('═'.repeat(80));
  console.log('🌍 i18n Translation Consistency Check');
  console.log('═'.repeat(80));
  console.log();

  // Extract keys from all language files
  const allKeys = {};
  let parseErrors = false;

  for (const [code, name] of Object.entries(languages)) {
    const filePath = join(LOCALES_DIR, `${code}.ts`);

    try {
      console.log(`📄 Parsing ${name} (${code})...`);
      const keys = extractKeyPaths(filePath);
      allKeys[code] = keys;
      console.log(`   ✅ ${keys.length} translation keys found`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      allKeys[code] = [];
      parseErrors = true;
    }
  }

  if (parseErrors) {
    console.log();
    console.log('❌ Some files could not be parsed. Please check the errors above.');
    process.exit(1);
  }

  console.log();
  console.log('═'.repeat(80));
  console.log('🔍 Consistency Analysis');
  console.log('═'.repeat(80));
  console.log();

  // Use English as reference
  const referenceKeys = new Set(allKeys.en || []);
  const referenceCount = referenceKeys.size;

  console.log(`📌 Using English as reference: ${referenceCount} keys`);
  console.log();

  let hasIssues = false;
  const results = [];

  // Check each language against reference
  for (const [code, name] of Object.entries(languages)) {
    if (code === 'en') {
      results.push({ code, name, status: '✅', keys: allKeys[code].length, missing: 0, extra: 0 });
      continue;
    }

    const langKeys = new Set(allKeys[code] || []);
    const missing = [...referenceKeys].filter(k => !langKeys.has(k)).sort();
    const extra = [...langKeys].filter(k => !referenceKeys.has(k)).sort();

    if (missing.length === 0 && extra.length === 0) {
      results.push({ code, name, status: '✅', keys: langKeys.size, missing: 0, extra: 0 });
      console.log(`✅ ${name} (${code}): Perfect match! All ${langKeys.size} keys present.`);
    } else {
      hasIssues = true;
      results.push({ code, name, status: '❌', keys: langKeys.size, missing: missing.length, extra: extra.length });

      console.log(`❌ ${name} (${code}): Inconsistencies detected!`);

      if (missing.length > 0) {
        console.log(`   📉 Missing ${missing.length} keys:`);
        missing.forEach(key => console.log(`      - ${key}`));
      }

      if (extra.length > 0) {
        console.log(`   📈 Extra ${extra.length} keys (not in English):`);
        extra.forEach(key => console.log(`      + ${key}`));
      }
    }
    console.log();
  }

  // Summary table
  console.log('═'.repeat(80));
  console.log('📊 Summary');
  console.log('═'.repeat(80));
  console.log();
  console.log('Language        | Status | Total Keys | Missing | Extra');
  console.log('----------------|--------|------------|---------|-------');

  for (const result of results) {
    console.log(
      `${result.name.padEnd(15)} | ${result.status}     | ${String(result.keys).padStart(10)} | ${String(result.missing).padStart(7)} | ${String(result.extra).padStart(5)}`
    );
  }

  console.log();
  console.log('═'.repeat(80));

  if (hasIssues) {
    console.log('❌ FAILED: Translation inconsistencies detected!');
    console.log('   Please add missing translations or remove extra keys.');
    console.log('═'.repeat(80));
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: All translations are consistent!');
    console.log(`   All ${referenceCount} translation keys are present in every language.`);
    console.log('═'.repeat(80));
    process.exit(0);
  }
}

// Run the check
main();
