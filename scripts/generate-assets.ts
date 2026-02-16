import fs from 'node:fs';
import path from 'node:path';

// Read the catalog file - assuming it's in the project root
const products = JSON.parse(fs.readFileSync('products-catalog.json', 'utf-8'));

// Slugify function
const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w-]+/g, '')       // Remove all non-word chars
  .replace(/--+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

// Prompt generator
const generatePrompts = (product) => {
  const baseName = product.name;
  const category = product.category;
  
  const prompts = [];
  
  // General professional shot
  prompts.push(`Professional studio photography of ${baseName}, white background, 4k, sharp focus`);

  if (category === 'Textiles') {
    prompts.push(`Close-up macro shot of ${baseName} fabric texture and weave details`);
    prompts.push(`Folded stack of ${baseName} showing color variations`);
  } else if (category === 'Electronics') {
    prompts.push(`Sleek angle view of ${baseName} with dramatic lighting`);
    prompts.push(`${baseName} in a modern lifestyle setting, soft blur background`);
  } else if (category === 'Food & Beverage') {
    prompts.push(`Appetizing presentation of ${baseName}, fresh ingredients surrounding`);
    prompts.push(`Packaging detail shot of ${baseName} showing label information`);
  } else if (category === 'Construction Materials') {
    prompts.push(`Industrial setting showing ${baseName} at a construction site`);
    prompts.push(`Stacked quantity of ${baseName} ready for delivery`);
  } else {
    prompts.push(`Detail shot of ${baseName} features`);
    prompts.push(`${baseName} being used in a typical environment`);
  }
  
  return prompts;
};

const imageMap = {};
let downloadScript = '#!/bin/bash\n\n# Created by Gemini CLI\n\n';

products.forEach(product => {
  const slug = slugify(product.name);
  const categorySlug = slugify(product.category);
  const prompts = generatePrompts(product);
  
  // Using placehold.co to simulate the images with the text prompt embedded
  // In a real scenario, these URLs would come from an AI generation API
  const urls = prompts.map(p => `https://placehold.co/800x600/png?text=${encodeURIComponent(p.substring(0, 50))}`);
  
  imageMap[slug] = urls;

  // Add to download script
  const targetDir = `product-images/${categorySlug}/${slug}`;
  downloadScript += `echo "Processing ${slug}..."\n`;
  downloadScript += `mkdir -p "${targetDir}"\n`;
  
  urls.forEach((url, index) => {
    downloadScript += `curl -L -s "${url}" -o "${targetDir}/image-${index + 1}.png"\n`;
  });
  downloadScript += '\n';
});

// Output
fs.writeFileSync('product-images.json', JSON.stringify(imageMap, null, 2));
fs.writeFileSync('download-images.sh', downloadScript);
console.log('Successfully generated product-images.json and download-images.sh');
