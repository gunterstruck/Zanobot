#!/usr/bin/env python3
"""
Translation Consistency Checker - Detailed Report
Analyzes all translation files and shows complete missing keys
"""

import re
from pathlib import Path

def extract_keys_from_ts(file_path):
    """Extract all translation keys from a TypeScript file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the export const line to get the start of the object
    match = re.search(r'export const \w+: TranslationDict = ({.*});', content, re.DOTALL)
    if not match:
        return set()

    obj_content = match.group(1)
    keys = set()

    def extract_nested_keys(text, prefix=''):
        """Recursively extract keys from nested structures"""
        lines = text.split('\n')
        current_path = []

        for line in lines:
            # Skip comments and empty lines
            stripped = line.strip()
            if not stripped or stripped.startswith('//'):
                continue

            # Count braces to track nesting
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
    print('DETAILED Translation Consistency Report')
    print('=' * 80)
    print()

    # Extract keys from all language files
    all_keys = {}
    for code, name in languages.items():
        file_path = locale_dir / f'{code}.ts'
        if file_path.exists():
            keys = extract_keys_from_ts(file_path)
            all_keys[code] = keys
            print(f'{name} ({code}): {len(keys)} keys')
        else:
            print(f'❌ {name} ({code}): File not found!')
            all_keys[code] = set()

    print()
    print('=' * 80)
    print()

    # Use English as reference
    reference_keys = all_keys.get('en', set())

    # Check each language and collect all missing keys
    for code, name in languages.items():
        if code == 'en':
            continue

        lang_keys = all_keys[code]
        missing = sorted(reference_keys - lang_keys)

        print(f'{name} ({code}):')
        print('-' * 80)

        if missing:
            print(f'❌ MISSING {len(missing)} keys:\n')
            for i, key in enumerate(missing, 1):
                print(f'{i:3d}. {key}')
        else:
            print('✅ All keys present!')

        print()
        print('=' * 80)
        print()

    # Summary
    print('SUMMARY:')
    print('-' * 80)
    total_missing = 0
    for code, name in languages.items():
        if code == 'en':
            continue
        missing_count = len(reference_keys - all_keys[code])
        total_missing += missing_count
        status = '✅' if missing_count == 0 else '❌'
        print(f'{status} {name:15s} ({code}): {missing_count:3d} missing keys')

    print()
    if total_missing == 0:
        print('✅ All languages are complete and consistent!')
        return 0
    else:
        print(f'❌ Total missing keys across all languages: {total_missing}')
        return 1

if __name__ == '__main__':
    exit(main())
