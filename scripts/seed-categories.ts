
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

const mainCategories = [
  {
    name: 'Electronics',
    icon: 'Cpu',
    subcategories: [
      { name: 'Mobile Phones', icon: 'Smartphone' },
      { name: 'Televisions', icon: 'Tv' },
      { name: 'Laptops & Computers', icon: 'Laptop' },
      { name: 'Audio & Headphones', icon: 'Headphones' },
      { name: 'Cameras & Photography', icon: 'Camera' },
      { name: 'Wearable Technology', icon: 'Watch' },
      { name: 'Home Appliances', icon: 'Refrigerator' },
      { name: 'Computer Accessories', icon: 'Mouse' },
    ],
  },
  {
    name: 'Textiles',
    icon: 'Shirt',
    subcategories: [
      { name: 'Fabrics', icon: 'Scroll' },
      { name: 'Yarn', icon: 'Package' },
      { name: 'Ready-made Garments', icon: 'Shirt' },
      { name: 'Home Textiles', icon: 'Bed' },
      { name: 'Apparel Accessories', icon: 'Scissors' },
      { name: 'Leather Goods', icon: 'Briefcase' },
    ],
  },
  {
    name: 'Food & Beverage',
    icon: 'Apple',
    subcategories: [
      { name: 'Grains, Rice & Cereal', icon: 'Wheat' },
      { name: 'Edible Oils', icon: 'Droplet' },
      { name: 'Spices & Herbs', icon: 'Pepper' },
      { name: 'Tea & Coffee', icon: 'Coffee' },
      { name: 'Dairy Products', icon: 'Milk' },
      { name: 'Processed Food', icon: 'Canned' },
      { name: 'Fresh Produce', icon: 'Carrot' },
      { name: 'Beverages', icon: 'Cup' },
    ],
  },
  {
    name: 'Construction Materials',
    icon: 'Hammer',
    subcategories: [
      { name: 'Cement', icon: 'Brick' },
      { name: 'Steel & Rods', icon: 'Construction' },
      { name: 'Bricks & Blocks', icon: 'Wall' },
      { name: 'Sand & Aggregates', icon: 'Mountain' },
      { name: 'Tiles & Flooring', icon: 'Grid' },
      { name: 'Paints & Coatings', icon: 'Brush' },
      { name: 'Sanitary Ware', icon: 'Bath' },
      { name: 'Pipes & Fittings', icon: 'Wrench' },
    ],
  },
  {
    name: 'Machinery',
    icon: 'Cog',
    subcategories: [
      { name: 'Agricultural Machinery', icon: 'Tractor' },
      { name: 'Industrial Machinery', icon: 'Factory' },
      { name: 'Power Tools', icon: 'Drill' },
      { name: 'Generators & Power', icon: 'Zap' },
      { name: 'Pumps & Motors', icon: 'Activity' },
    ],
  },
  {
    name: 'Packaging',
    icon: 'Box',
    subcategories: [
      { name: 'Cartons & Boxes', icon: 'Package' },
      { name: 'Plastic Packaging', icon: 'ShoppingBag' },
      { name: 'Jute Bags', icon: 'ShoppingBag' },
      { name: 'Labels & Tags', icon: 'Tag' },
      { name: 'Bottles & Jars', icon: 'Bottle' },
    ],
  },
  {
    name: 'Furniture',
    icon: 'Armchair',
    subcategories: [
      { name: 'Office Furniture', icon: 'Briefcase' },
      { name: 'Home Furniture', icon: 'Sofa' },
      { name: 'Plastic Furniture', icon: 'Chair' },
      { name: 'School Furniture', icon: 'Book' },
    ],
  },
  {
    name: 'Consumer Goods',
    icon: 'ShoppingBag',
    subcategories: [
      { name: 'Cleaning Supplies', icon: 'Sparkles' },
      { name: 'Toiletries', icon: 'Smile' },
      { name: 'Stationery', icon: 'Pen' },
      { name: 'Kitchenware', icon: 'Utensils' },
    ],
  },
  {
    name: 'Automotive',
    icon: 'Car',
    subcategories: [
      { name: 'Car Parts', icon: 'Wrench' },
      { name: 'Motorcycle Parts', icon: 'Bike' },
      { name: 'Lubricants & Oils', icon: 'Droplet' },
      { name: 'Tires & Wheels', icon: 'Disc' },
    ],
  },
  {
    name: 'Agriculture',
    icon: 'Sprout',
    subcategories: [
      { name: 'Seeds', icon: 'Sprout' },
      { name: 'Fertilizers', icon: 'Leaf' },
      { name: 'Pesticides', icon: 'Shield' },
      { name: 'Animal Feed', icon: 'Bone' },
    ],
  },
];

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

async function seedCategories() {
  console.log('Seeding categories...');

  try {
    for (const cat of mainCategories) {
      const slug = slugify(cat.name);
      
      // Check if exists
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      let parentId: number;

      if (existing.length > 0) {
        console.log(`Category ${cat.name} already exists, skipping insert.`);
        parentId = existing[0].id;
      } else {
        const [inserted] = await db
          .insert(categories)
          .values({
            name: cat.name,
            slug: slug,
            icon: cat.icon,
          })
          .returning({ id: categories.id });
        parentId = inserted.id;
        console.log(`Inserted category: ${cat.name}`);
      }

      for (const sub of cat.subcategories) {
        const subSlug = slugify(sub.name);
        
         // Check if sub exists
        const existingSub = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, subSlug))
        .limit(1);

        if (existingSub.length === 0) {
            await db.insert(categories).values({
            name: sub.name,
            slug: subSlug,
            icon: sub.icon,
            parentId: parentId,
            });
            console.log(`  Inserted subcategory: ${sub.name}`);
        } else {
            console.log(`  Subcategory ${sub.name} already exists, skipping.`);
        }
      }
    }
    console.log('Categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
