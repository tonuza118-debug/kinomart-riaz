import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Running schema.sql against', maskUrl(process.env.DATABASE_URL));
  await pool.query(sql);
  console.log('Schema created/verified.');

  // Seed a default settings row if none exists yet, so the storefront has
  // something sane to render on first boot.
  const { rows } = await pool.query("SELECT 1 FROM settings WHERE id = 'main'");
  if (rows.length === 0) {
    const defaultSettings = {
      websiteTitle: 'KinoMart',
      tagline: 'সেরা গ্যাজেট ও প্রিমিয়াম ইলেকট্রনিক্স',
      logoUrl: '',
      faviconUrl: '',
      topBannerEnabled: false,
      topBannerText: '',
      facebookPixelId: '',
      capiAccessToken: '',
      bkashNumber: '',
      nagadNumber: '',
      phone: '',
      whatsapp: '',
      email: 'support@kinomart.com',
      address: 'ঢাকা, বাংলাদেশ',
      footerAbout: 'কীনোমার্ট বাংলাদেশের একটি বিশ্বস্ত প্রিমিয়াম অনলাইন শপ।',
      adminUsername: 'kinomart',
      adminPasswordHash: '@kinomart@',
      deliveryFeeInside: 60,
      deliveryFeeOutside: 120,
    };
    await pool.query("INSERT INTO settings (id, data) VALUES ('main', $1)", [defaultSettings]);
    console.log('Seeded default settings row.');
  } else {
    console.log('Settings row already present, skipping seed.');
  }

  await pool.end();
}

function maskUrl(url) {
  if (!url) return '(none)';
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
