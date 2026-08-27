import { Category, Coupon, Order, Product, StoreSettings, TeamMember, HeroSlide, PromoBannerConfig } from '../types';

export const INITIAL_SETTINGS: StoreSettings = {
  websiteTitle: 'KinoMart',
  tagline: 'সেরা গ্যাজেট ও প্রিমিয়াম ইলেকট্রনিক্স',
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
  footerAbout: 'কীনোমার্ট বাংলাদেশের একটি বিশ্বস্ত প্রিমিয়াম অনলাইন শপ। আমরা সরবরাহ করি ১০০% অরিজিনাল ও মানসম্মত প্রোডাক্ট।',
  adminUsername: 'kinomart',
  adminPasswordHash: '@kinomart@',
  r2AccountId: 'e731735be156543f033f2f9f611cb44c',
  r2BucketName: 'kinomart',
  r2PublicUrl: 'https://pub-5b578dfe75d2479c8a74e0953fe58b53.r2.dev',
  r2S3Endpoint: 'https://e731735be156543f033f2f9f611cb44c.r2.cloudflarestorage.com/kinomart',
  // SECURITY: do not hardcode real R2 keys here — this file is bundled into the public
  // client JS and is readable by anyone via "view source". Set these from the Admin
  // Settings panel instead (stored in localStorage / your own settings table).
  r2AccessKeyId: '',
  r2SecretAccessKey: ''
};

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_COUPONS: Coupon[] = [];

export const INITIAL_TEAM: TeamMember[] = [];

export const INITIAL_HERO_SLIDES: HeroSlide[] = [];

export const HERO_SLIDES: HeroSlide[] = [];

export const INITIAL_PROMO_BANNER: PromoBannerConfig = {
  isEnabled: false,
  badgeText: '',
  title: '',
  subtitle: '',
  buttonText: 'অফারটি দেখুন',
  linkType: 'all_products',
  bgColor: '#434F33'
};
