const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = {
  icon: [16, 32, 48, 64, 96, 128, 192, 256, 384, 512],
  logo: [128, 256, 512, 1024],
  social: [
    { width: 1200, height: 630, name: 'og-image' },
    { width: 800, height: 418, name: 'twitter-image' }
  ]
};

async function generateImages() {
  // Generate icons
  for (const size of sizes.icon) {
    await sharp('public/images/logo/logo-mark.svg')
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`);
    
    console.log(`Generated icon-${size}.png`);
  }

  // Generate logos
  for (const size of sizes.logo) {
    await sharp('public/images/logo/logo-light.svg')
      .resize(size)
      .png()
      .toFile(`public/images/logo/logo-light-${size}.png`);
    
    await sharp('public/images/logo/logo-dark.svg')
      .resize(size)
      .png()
      .toFile(`public/images/logo/logo-dark-${size}.png`);
    
    await sharp('public/images/logo/logo-mark.svg')
      .resize(size)
      .png()
      .toFile(`public/images/logo/logo-mark-${size}.png`);
    
    console.log(`Generated logo variants at ${size}px`);
  }

  // Generate social images
  for (const social of sizes.social) {
    await sharp(`public/${social.name}.svg`)
      .resize(social.width, social.height)
      .png()
      .toFile(`public/${social.name}.png`);
    
    console.log(`Generated ${social.name}.png`);
  }

  // Generate shortcut icons
  await sharp('public/shortcuts/wallet.svg')
    .resize(96, 96)
    .png()
    .toFile('public/shortcuts/wallet.png');
  
  await sharp('public/shortcuts/trade.svg')
    .resize(96, 96)
    .png()
    .toFile('public/shortcuts/trade.png');
  
  console.log('Generated shortcut icons');
}

generateImages().catch(console.error); 