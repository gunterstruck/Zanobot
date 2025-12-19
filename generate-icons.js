#!/usr/bin/env node

/**
 * PWA Icon Generator for Zanobot
 * Generates all required icon sizes from the master SVG
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required by manifest.json
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Additional icons for shortcuts
const SHORTCUT_SIZES = [96];

console.log('🎨 Zanobot PWA Icon Generator\n');

// Check if sharp is installed
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.error('❌ Error: sharp module not found');
    console.log('📦 Installing sharp...\n');

    const { execSync } = require('child_process');
    try {
        execSync('npm install sharp', { stdio: 'inherit' });
        sharp = require('sharp');
        console.log('\n✅ Sharp installed successfully\n');
    } catch (installError) {
        console.error('❌ Failed to install sharp:', installError.message);
        process.exit(1);
    }
}

const iconDir = path.join(__dirname, 'icons');
const masterSvgPath = path.join(iconDir, 'icon-master.svg');

// Ensure master SVG exists
if (!fs.existsSync(masterSvgPath)) {
    console.error('❌ Error: icon-master.svg not found');
    process.exit(1);
}

async function generateIcons() {
    console.log('📝 Reading master SVG...');

    const svgBuffer = fs.readFileSync(masterSvgPath);

    console.log('🔄 Generating icons...\n');

    // Generate main icons
    for (const size of ICON_SIZES) {
        const outputPath = path.join(iconDir, `icon-${size}.png`);

        try {
            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated icon-${size}.png (${size}x${size})`);
        } catch (error) {
            console.error(`❌ Failed to generate icon-${size}.png:`, error.message);
        }
    }

    // Generate shortcut icons (simplified versions)
    console.log('\n🔄 Generating shortcut icons...\n');

    // Create a simplified diagnosis icon
    const diagnosisSvg = `
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" rx="20" fill="#0A1929"/>
        <polyline points="75 20 45 50 30 35 10 55" stroke="#00D4FF" stroke-width="4" fill="none"/>
        <polyline points="60 20 75 20 75 35" stroke="#00D4FF" stroke-width="4" fill="none"/>
    </svg>`;

    const diagnosisPath = path.join(iconDir, 'shortcut-diagnosis.png');
    await sharp(Buffer.from(diagnosisSvg))
        .resize(96, 96)
        .png()
        .toFile(diagnosisPath);

    console.log('✅ Generated shortcut-diagnosis.png (96x96)');

    // Create a simplified record icon
    const recordSvg = `
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" rx="20" fill="#0A1929"/>
        <path d="M48 20 a10 10 0 0 0-10 10 v20 a10 10 0 0 0 20 0 V30 a10 10 0 0 0-10-10 z" fill="none" stroke="#00D4FF" stroke-width="4"/>
        <path d="M65 45 v5 a17 17 0 0 1-34 0 v-5" stroke="#00D4FF" stroke-width="4" fill="none"/>
        <line x1="48" y1="67" x2="48" y2="80" stroke="#00D4FF" stroke-width="4"/>
        <line x1="35" y1="80" x2="61" y2="80" stroke="#00D4FF" stroke-width="4"/>
    </svg>`;

    const recordPath = path.join(iconDir, 'shortcut-record.png');
    await sharp(Buffer.from(recordSvg))
        .resize(96, 96)
        .png()
        .toFile(recordPath);

    console.log('✅ Generated shortcut-record.png (96x96)');

    // Generate badge icon (for notifications)
    const badgeSvg = `
    <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="36" r="36" fill="#0A1929"/>
        <circle cx="36" cy="36" r="20" stroke="#00D4FF" stroke-width="3" fill="none"/>
        <circle cx="36" cy="36" r="8" fill="#00D4FF"/>
    </svg>`;

    const badgePath = path.join(iconDir, 'badge-72.png');
    await sharp(Buffer.from(badgeSvg))
        .resize(72, 72)
        .png()
        .toFile(badgePath);

    console.log('✅ Generated badge-72.png (72x72)');

    console.log('\n🎉 All icons generated successfully!');
    console.log(`📁 Icons saved to: ${iconDir}`);
}

// Run the generator
generateIcons().catch((error) => {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
});
