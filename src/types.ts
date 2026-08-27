export interface ProductBundle {
  id: string;
  title: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  badgeText?: string;
  tagText?: string;
  isPopular?: boolean;
  iconType?: 'green_dot' | 'gold_dot' | 'fire' | 'star';
}

export interface ProductFlavor {
  id: string;
  name: string;
  icon?: string; // emoji e.g. 🍇, 🍉, 🌿, 🍑, 🍋, 🐂 or icon label
  bgColor?: string; // e.g. '#F3E8FF'
  textColor?: string; // e.g. '#7E22CE'
  price?: number; // optional custom unit price for this flavor
  originalPrice?: number;
  inStock?: boolean;
}

export interface Specification {
  key: string;
  value: string;
}

export interface Review {
  id: string;
  userName: string;
  userRole?: string;
  rating: number;
  comment: string;
  date?: string;
  isVerifiedPurchase?: boolean;
  image?: string;
  avatarColor?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  category: string;
  subCategory?: string;
  stock: number;
  limitedStockThreshold?: number;
  colors?: string[];
  hasFlavors?: boolean;
  flavorTitle?: string;
  flavors?: ProductFlavor[];
  thumbnail: string;
  gallery: string[];
  videoUrl?: string;
  shortDescription?: string;
  longDescription?: string;
  specifications?: Specification[];
  bundles?: ProductBundle[];
  bundleStyle?: 'radio_cards' | 'banner_table' | 'both';
  showBannerTableSection?: boolean;
  bundleBannerTitle?: string;
  bundleBannerSubtitle?: string;
  bannerTablePosition?: 'top' | 'above_details' | 'both';
  hasTimer?: boolean;
  timerTitle?: string;
  timerEndTime?: string;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  rating: number;
  reviewsCount: number;
  reviews?: Review[];
  reviewImages?: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  position: number;
  isVisibleOnHome: boolean;
  subCategories: string[];
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  isActive: boolean;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type CallStatus = 'Not Called' | 'Call Success' | 'Customer Busy' | 'Fake Order' | 'Pending Confirmation';

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedBundle?: ProductBundle | string;
  selectedFlavors?: { [flavorName: string]: number };
  flavorSummary?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. KM-74646
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryArea: 'Inside Dhaka' | 'Outside Dhaka';
  deliveryFee: number;
  paymentMethod: 'COD' | 'bKash' | 'Nagad';
  senderPhone?: string;
  trxId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  totalPrice: number;
  status: OrderStatus;
  callStatus: CallStatus;
  createdAt: string; // ISO or formatted
  notes?: string;
}

export interface StoreSettings {
  websiteTitle: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  topBannerEnabled: boolean;
  topBannerText: string;
  facebookPixelId: string;
  capiAccessToken: string;
  gtmId?: string;
  gaMeasurementId?: string;
  bkashNumber: string;
  nagadNumber: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  footerAbout: string;
  adminUsername: string;
  adminPasswordHash: string;
  deliveryFeeInside?: number;
  deliveryFeeOutside?: number;
  supabaseUrl?: string;
  supabaseKey?: string;
  heroSliderInterval?: number; // autoplay interval in ms (default 5000)
  r2AccountId?: string;
  r2BucketName?: string;
  r2PublicUrl?: string;
  r2S3Endpoint?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
}

export interface HeroSlide {
  id: string | number;
  image: string;
  title: string;
  subtitle?: string;
  linkType?: 'all_products' | 'category' | 'product' | 'custom_url';
  linkValue?: string;
  isActive?: boolean;
  order?: number;
}

export interface PromoBannerConfig {
  isEnabled: boolean;
  badgeText: string;
  title: string;
  subtitle: string;
  buttonText: string;
  linkType?: 'all_products' | 'category' | 'product' | 'custom_url';
  linkValue?: string;
  bgImageUrl?: string;
  bgColor?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  image?: string;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
}

export interface MockSMSLog {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  message: string;
  status: 'DELIVERED' | 'FAILED' | 'SENDING';
  sentAt: string;
  gateway: string;
  messageId: string;
}

