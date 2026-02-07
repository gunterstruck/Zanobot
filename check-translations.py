#!/usr/bin/env python3
"""
Translation Consistency Checker
Analyzes all translation files and checks for missing keys
"""

import re
import json
from pathlib import Path
from collections import defaultdict

def extract_keys_from_ts(file_path):
    """Extract all translation keys from a TypeScript file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the export const line to get the start of the object
    match = re.search(r'export const \w+: TranslationDict = ({.*});', content, re.DOTALL)
    if not match:
        return set()

    obj_content = match.group(1)

    # Extract all keys using regex
    # Match patterns like: key: 'value' or key: { or key: `value`
    keys = set()

    # Find all key definitions (accounting for nested objects)
    # This regex finds keys at any level
    key_pattern = re.compile(r"^\s*(\w+):\s*['{`\{]", re.MULTILINE)

    def extract_nested_keys(text, prefix=''):
        """Recursively extract keys from nested structures"""
        lines = text.split('\n')
        stack = []
        current_path = []

        for line in lines:
            # Skip comments and empty lines
            stripped = line.strip()
            if not stripped or stripped.startswith('//'):
                continue

            # Count braces to track nesting
            open_braces = line.count('{')
            close_braces = line.count('}')

            # Extract key name
            key_match = re.match(r'^\s*(\w+):\s*(.*)$', line)
            if key_match:
                key_name = key_match.group(1)
                value_part = key_match.group(2).strip()

                # Build full path
                full_key = '.'.join(current_path + [key_name])

                if value_part.startswith('{'):
                    # This is a nested object
                    current_path.append(key_name)
                else:
                    # This is a leaf value
                    keys.add(full_key)

            # Adjust nesting level based on braces
            if close_braces > 0:
                for _ in range(close_braces):
                    if current_path:
                        current_path.pop()

    extract_nested_keys(obj_content)
    return keys

def main():
    locale_dir = Path('src/i18n/locales')

    languages = {
        'en': 'English',
        'de': 'German',
        'es': 'Spanish',
        'fr': 'French',
        'zh': 'Chinese'
    }

    print('=' * 80)
    print('Translation Consistency Check')
    print('=' * 80)
    print()

    # Extract keys from all language files
    all_keys = {}
    for code, name in languages.items():
        file_path = locale_dir / f'{code}.ts'
        if file_path.exists():
            keys = extract_keys_from_ts(file_path)
            all_keys[code] = keys
            print(f'{name} ({code}): {len(keys)} keys found')
        else:
            print(f'❌ {name} ({code}): File not found!')
            all_keys[code] = set()

    print()

    # Use English as reference
    reference_keys = all_keys.get('en', set())
    print(f'Using English as reference with {len(reference_keys)} keys')
    print()

    # Check each language
    has_issues = False

    for code, name in languages.items():
        if code == 'en':
            continue

        lang_keys = all_keys[code]

        missing = reference_keys - lang_keys
        extra = lang_keys - reference_keys

        if missing or extra:
            has_issues = True
            print('-' * 80)
            print(f'{name} ({code}) - INCONSISTENCIES FOUND')
            print('-' * 80)

            if missing:
                print(f'\n❌ MISSING {len(missing)} keys in {name}:')
                for key in sorted(missing)[:20]:  # Show first 20
                    print(f'  - {key}')
                if len(missing) > 20:
                    print(f'  ... and {len(missing) - 20} more')

            if extra:
                print(f'\n➕ EXTRA {len(extra)} keys in {name} (not in English):')
                for key in sorted(extra)[:20]:  # Show first 20
                    print(f'  + {key}')
                if len(extra) > 20:
                    print(f'  ... and {len(extra) - 20} more')

            print()
        else:
            print(f'✅ {name} ({code}): All keys match English reference!')

    print('=' * 80)

    if not has_issues:
        print('✅ SUCCESS: All languages are consistent!')
        return 0
    else:
        print('❌ FAILURE: Inconsistencies found!')
        print('\nRecommendation: Please add missing keys to incomplete language files.')
        return 1

if __name__ == '__main__':
    exit(main())
