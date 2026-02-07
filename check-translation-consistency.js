/**
 * Translation Consistency Checker
 * Verifies that all language files have the same structure and keys
 */

import { en } from './src/i18n/locales/en.js';
import { de } from './src/i18n/locales/de.js';
import { es } from './src/i18n/locales/es.js';
import { fr } from './src/i18n/locales/fr.js';
import { zh } from './src/i18n/locales/zh.js';

// Extract all keys from a nested object
function extractKeys(obj, prefix = '') {
  const keys = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

// Compare two arrays of keys
function compareKeys(keys1, keys2) {
  const missing = keys1.filter(k => !keys2.includes(k));
  const extra = keys2.filter(k => !keys1.includes(k));
  return { missing, extra };
}

console.log('='.repeat(80));
console.log('Translation Consistency Check');
console.log('='.repeat(80));
console.log();

const languages = {
  en: { name: 'English', obj: en },
  de: { name: 'German', obj: de },
  es: { name: 'Spanish', obj: es },
  fr: { name: 'French', obj: fr },
  zh: { name: 'Chinese', obj: zh }
};

// Extract keys from all languages
const allKeys = {};
for (const [code, lang] of Object.entries(languages)) {
  allKeys[code] = extractKeys(lang.obj);
  console.log(`${lang.name} (${code}): ${allKeys[code].length} keys`);
}
console.log();

// Use English as reference
const referenceKeys = allKeys.en;
console.log(`Using English as reference with ${referenceKeys.length} keys`);
console.log();

// Check each language against English
let hasIssues = false;

for (const [code, lang] of Object.entries(languages)) {
  if (code === 'en') continue;

  const comparison = compareKeys(referenceKeys, allKeys[code]);

  if (comparison.missing.length > 0 || comparison.extra.length > 0) {
    hasIssues = true;
    console.log('-'.repeat(80));
    console.log(`${lang.name} (${code}) - INCONSISTENCIES FOUND`);
    console.log('-'.repeat(80));

    if (comparison.missing.length > 0) {
      console.log(`\nMISSING ${comparison.missing.length} keys in ${lang.name}:`);
      comparison.missing.forEach(key => console.log(`  ❌ ${key}`));
    }

    if (comparison.extra.length > 0) {
      console.log(`\nEXTRA ${comparison.extra.length} keys in ${lang.name} (not in English):`);
      comparison.extra.forEach(key => console.log(`  ➕ ${key}`));
    }
    console.log();
  } else {
    console.log(`✅ ${lang.name} (${code}): All keys match English reference`);
  }
}

console.log('='.repeat(80));

if (!hasIssues) {
  console.log('✅ SUCCESS: All languages are consistent!');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Inconsistencies found!');
  process.exit(1);
}
