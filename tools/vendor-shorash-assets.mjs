import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = {
  categories: 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/migration/shorash/categories.json',
  products: 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/migration/shorash/products.json',
  options: 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/migration/shorash/product_options.json'
};
const FALLBACK_LOGO = 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/assets/shorash-logo.jpeg';
const FALLBACK_BACKGROUND = 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/assets/background.mp4';

async function get(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'RESTBR-static-vendor/1.0' }
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

async function getJson(url) {
  return (await get(url)).json();
}

function extensionFrom(url, contentType = '') {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return ext;
  } catch (_) {}
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  return '.jpg';
}

async function saveUrl(url, file) {
  const response = await get(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error(`empty file ${url}`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
  return { bytes: buffer.length, contentType: response.headers.get('content-type') || '' };
}

async function parallel(items, limit, worker) {
  let cursor = 0;
  let completed = 0;
  const jobs = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
      completed += 1;
      if (completed % 20 === 0 || completed === items.length) console.log(`Downloaded ${completed}/${items.length} product assets`);
    }
  });
  await Promise.all(jobs);
}

const [categories, products, options] = await Promise.all([
  getJson(SOURCE.categories),
  getJson(SOURCE.products),
  getJson(SOURCE.options)
]);

if (!Array.isArray(categories) || !Array.isArray(products) || !Array.isArray(options)) {
  throw new Error('Invalid Shorash export format');
}

await fs.mkdir(path.join(ROOT, 'assets', 'products'), { recursive: true });
await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });

const failures = [];
await parallel(products, 8, async product => {
  if (!product?.id || !product?.image_url) return;
  const original = String(product.image_url);
  try {
    const initialExt = extensionFrom(original);
    let target = path.join(ROOT, 'assets', 'products', `${product.id}${initialExt}`);
    const response = await get(original);
    const contentType = response.headers.get('content-type') || '';
    const ext = extensionFrom(original, contentType);
    target = path.join(ROOT, 'assets', 'products', `${product.id}${ext}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error('empty response');
    await fs.writeFile(target, buffer);
    product.image_url = `assets/products/${product.id}${ext}`;
  } catch (error) {
    failures.push({ id: product.id, url: original, error: String(error) });
    console.warn(`Keeping remote image for ${product.id}: ${error}`);
  }
});

await fs.writeFile(path.join(ROOT, 'data', 'categories-source.json'), `${JSON.stringify(categories, null, 2)}\n`);
await fs.writeFile(path.join(ROOT, 'data', 'products-source.json'), `${JSON.stringify(products, null, 2)}\n`);
await fs.writeFile(path.join(ROOT, 'data', 'product-options-source.json'), `${JSON.stringify(options, null, 2)}\n`);

const configPath = path.join(ROOT, 'data', 'restaurant.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

try {
  const logoSource = config.logo || FALLBACK_LOGO;
  await saveUrl(logoSource, path.join(ROOT, 'assets', 'logo.jpeg'));
  config.logo = 'assets/logo.jpeg';
} catch (error) {
  console.warn(`Primary logo copy failed: ${error}`);
  await saveUrl(FALLBACK_LOGO, path.join(ROOT, 'assets', 'logo.jpeg'));
  config.logo = 'assets/logo.jpeg';
}

try {
  const videoSource = config.background?.video || FALLBACK_BACKGROUND;
  await saveUrl(videoSource, path.join(ROOT, 'assets', 'background.mp4'));
  config.background ||= {};
  config.background.video = 'assets/background.mp4';
} catch (error) {
  console.warn(`Primary background copy failed: ${error}`);
  await saveUrl(FALLBACK_BACKGROUND, path.join(ROOT, 'assets', 'background.mp4'));
  config.background ||= {};
  config.background.video = 'assets/background.mp4';
}

await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
await fs.writeFile(path.join(ROOT, 'data', 'vendor-report.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  categories: categories.length,
  products: products.length,
  options: options.length,
  localProductImages: products.filter(p => String(p.image_url || '').startsWith('assets/products/')).length,
  failedImages: failures
}, null, 2)}\n`);

console.log(`Static source ready: ${categories.length} categories, ${products.length} products, ${options.length} options.`);
console.log(`Local product images: ${products.filter(p => String(p.image_url || '').startsWith('assets/products/')).length}/${products.length}.`);
if (failures.length) console.log(`Remote fallback images: ${failures.length}. See data/vendor-report.json.`);
