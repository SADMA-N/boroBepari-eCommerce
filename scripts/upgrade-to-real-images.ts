import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'products-catalog.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

const slugify = (text: string) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const generatePollinationsUrl = (prompt: string) => {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
};

async function upgradeImages() {
  console.log(`Starting upgrade for ${products.length} products to realistic images...`);
  
  let lines = [];
  lines.push("#!/bin/bash");
  lines.push("");
  lines.push("# Created by Gemini CLI - Real Images");
  lines.push("");

  for (const product of products) {
    const slug = slugify(product.name);
    const categorySlug = slugify(product.category);
    const targetDir = `product-images/${categorySlug}/${slug}`;
    
    // Ensure directory exists
    lines.push(`mkdir -p "${targetDir}"`);
    lines.push(`echo "Downloading real images for ${slug}..."`);

    // 1. Main Product Shot (Clean, White Background)
    const prompt1 = `professional product photography of ${product.name}, white background, studio lighting, 8k, sharp focus`;
    const url1 = generatePollinationsUrl(prompt1);
    lines.push(`curl -L -s "${url1}" -o "${targetDir}/image-1.png"`);

    // 2. Context/Lifestyle Shot
    const prompt2 = `${product.name} being used in real life context, cinematic lighting, photorealistic, depth of field`;
    const url2 = generatePollinationsUrl(prompt2);
    lines.push(`curl -L -s "${url2}" -o "${targetDir}/image-2.png"`);

    // 3. Detail/Texture Shot
    const prompt3 = `close up macro detail shot of ${product.name} texture and material, high quality, 4k`;
    const url3 = generatePollinationsUrl(prompt3);
    lines.push(`curl -L -s "${url3}" -o "${targetDir}/image-3.png"`);
    
    lines.push("");
  }

  fs.writeFileSync('download-real-images.sh', lines.join('\n'));
  console.log('Successfully generated download-real-images.sh');
}

upgradeImages();
