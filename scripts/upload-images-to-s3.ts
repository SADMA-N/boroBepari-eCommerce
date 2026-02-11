
import { uploadToS3 } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

const productImagesDir = path.join(process.cwd(), 'product-images');
const imagesMapPath = path.join(process.cwd(), 'product-images.json');
const imagesMap: Record<string, string[]> = {};

async function uploadImages() {
  if (!fs.existsSync(productImagesDir)) {
    console.error('Product images directory not found!');
    return;
  }

  const categories = fs.readdirSync(productImagesDir);

  for (const cat of categories) {
    const catPath = path.join(productImagesDir, cat);
    try {
        if (!fs.statSync(catPath).isDirectory()) continue;
    } catch (e) { continue; }

    const products = fs.readdirSync(catPath);

    for (const prod of products) {
      const prodPath = path.join(catPath, prod);
      try {
        if (!fs.statSync(prodPath).isDirectory()) continue;
      } catch (e) { continue; }

      const images = fs.readdirSync(prodPath).filter(f => !f.startsWith('.'));
      // Sort images to ensure image-1, image-2 order
      images.sort((a, b) => {
        const numA = parseInt(a.match(/(\d+)/)?.[0] || '0');
        const numB = parseInt(b.match(/(\d+)/)?.[0] || '0');
        return numA - numB;
      });

      const productUrls: string[] = [];

      for (const img of images) {
        const imgPath = path.join(prodPath, img);
        const buffer = fs.readFileSync(imgPath);
        
        // Key structure: product-images/category/product/image.png
        const key = `product-images/${cat}/${prod}/${img}`;
        
        console.log(`Uploading ${key}...`);
        
        try {
            await uploadToS3(buffer, key, 'image/png');
            
            // Construct public URL
            // Since we are likely using local fallback, it is /uploads/{key}
            // Even if S3 is used, we'd need to know the public URL structure. 
            // For now, valid local path is safest for this demo.
            const url = `/uploads/${key}`;
            productUrls.push(url);
        } catch (error) {
            console.error(`Failed to upload ${key}:`, error);
        }
      }
      
      imagesMap[prod] = productUrls;
    }
  }

  fs.writeFileSync(imagesMapPath, JSON.stringify(imagesMap, null, 2));
  console.log('Updated product-images.json with new URLs');
}

uploadImages();
