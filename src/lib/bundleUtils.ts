import { Product, ProductBundle } from '../types';

export function generateRadioCardBundles(price: number): ProductBundle[] {
  const basePrice = Math.max(10, Math.round(price));
  const orig1 = Math.round(basePrice * 1.315);

  const price2 = Math.round(basePrice * 1.82);
  const orig2 = Math.round(orig1 * 2);
  const save2 = Math.max(50, Math.round(basePrice * 2 - price2));

  const price4 = Math.round(basePrice * 3.538);
  const orig4 = Math.round(orig1 * 4);
  const save4 = Math.max(100, Math.round(basePrice * 4 - price4));

  return [
    {
      id: `b-radio-1-${Date.now()}`,
      title: '1 Pc',
      quantity: 1,
      price: basePrice,
      originalPrice: orig1,
      tagText: 'ক্যাশ অন ডেলিভারী',
      badgeText: '',
      isPopular: false
    },
    {
      id: `b-radio-2-${Date.now()}`,
      title: '2 Pc',
      quantity: 2,
      price: price2,
      originalPrice: orig2,
      tagText: 'ক্যাশ অন ডেলিভারী',
      badgeText: `🔥 SAVE ${save2} TK`,
      isPopular: true
    },
    {
      id: `b-radio-3-${Date.now()}`,
      title: '4 Pc',
      quantity: 4,
      price: price4,
      originalPrice: orig4,
      tagText: 'ক্যাশ অন ডেলিভারী',
      badgeText: `🔥 SAVE ${save4} TK`,
      isPopular: false
    }
  ];
}

export function generateBannerTableBundles(price: number): ProductBundle[] {
  return getDefaultBundles(price);
}

export function generateDemoSixTiers(price: number): ProductBundle[] {
  const basePrice = Math.max(10, Math.round(price));
  const orig1 = Math.round(basePrice * 1.666);

  // Progressive tiered pricing matching the screenshot
  const price2 = Math.round(basePrice * 1.769);
  const orig2 = Math.round(orig1 * 2);

  const price3 = Math.round(basePrice * 2.025);
  const orig3 = Math.round(orig1 * 3);

  const price4 = Math.round(basePrice * 2.794);
  const orig4 = Math.round(orig1 * 4);

  const price5 = Math.round(basePrice * 3.307);
  const orig5 = Math.round(orig1 * 5);

  const price6 = Math.round(basePrice * 3.820);
  const orig6 = Math.round(orig1 * 6);

  return [
    {
      id: `b-tier-1-${Date.now()}`,
      title: '১টি পণ্য',
      quantity: 1,
      price: basePrice,
      originalPrice: orig1,
      iconType: 'green_dot',
      isPopular: false
    },
    {
      id: `b-tier-2-${Date.now()}`,
      title: '২টি পণ্য',
      quantity: 2,
      price: price2,
      originalPrice: orig2,
      badgeText: '18% ছাড়',
      iconType: 'gold_dot',
      isPopular: false
    },
    {
      id: `b-tier-3-${Date.now()}`,
      title: '৩টি পণ্য',
      quantity: 3,
      price: price3,
      originalPrice: orig3,
      badgeText: '32% ছাড়',
      iconType: 'gold_dot',
      isPopular: false
    },
    {
      id: `b-tier-4-${Date.now()}`,
      title: '৪টি পণ্য',
      quantity: 4,
      price: price4,
      originalPrice: orig4,
      badgeText: '39% ছাড়',
      iconType: 'fire',
      isPopular: false
    },
    {
      id: `b-tier-5-${Date.now()}`,
      title: '৫টি পণ্য',
      quantity: 5,
      price: price5,
      originalPrice: orig5,
      badgeText: '43% ছাড়',
      iconType: 'fire',
      isPopular: false
    },
    {
      id: `b-tier-6-${Date.now()}`,
      title: '৬টি পণ্য (সব ফ্লেভার)',
      quantity: 6,
      price: price6,
      originalPrice: orig6,
      badgeText: '46% ছাড়',
      tagText: '(সেরা ডিল!)',
      iconType: 'fire',
      isPopular: true
    }
  ];
}

export function getDefaultBundles(price: number): ProductBundle[] {
  const basePrice = Math.round(price);
  const orig1 = Math.round(basePrice * 1.31);
  
  const price2 = Math.round(basePrice * 1.82);
  const orig2 = Math.round(basePrice * 2.63);
  const save2 = Math.max(0, basePrice * 2 - price2);

  const price4 = Math.round(basePrice * 3.53);
  const orig4 = Math.round(basePrice * 5.25);
  const save4 = Math.max(0, basePrice * 4 - price4);

  return [
    {
      id: `b-1-${Date.now()}`,
      title: '১টি পণ্য',
      quantity: 1,
      price: basePrice,
      originalPrice: orig1,
      iconType: 'green_dot',
      isPopular: false
    },
    {
      id: `b-2-${Date.now()}`,
      title: '২টি পণ্য',
      quantity: 2,
      price: price2,
      originalPrice: orig2,
      badgeText: '১৮% ছাড়',
      tagText: '(বেশি বিক্রিত)',
      iconType: 'gold_dot',
      isPopular: true
    },
    {
      id: `b-3-${Date.now()}`,
      title: '৪টি পণ্য',
      quantity: 4,
      price: price4,
      originalPrice: orig4,
      badgeText: '৩৫% ছাড়',
      tagText: '(মেগা সেভার)',
      iconType: 'fire',
      isPopular: false
    }
  ];
}

export function getEffectiveBundles(product: Product): ProductBundle[] {
  if (product.bundles && product.bundles.length > 0) {
    return product.bundles;
  }
  return [];
}

export interface PriceCalculationResult {
  totalPrice: number;
  originalPrice?: number | null;
  activeBundle?: ProductBundle;
  activeBundleId: string;
  isCustomQuantity: boolean;
}

/**
 * Calculates total price and active bundle seamlessly for any quantity,
 * ensuring prices correctly scale when quantity > 3 or exceeds bundle tiers.
 */
export function calculateProductPrice(
  product: Product,
  quantity: number,
  selectedBundleId?: string
): PriceCalculationResult {
  const effectiveBundles = getEffectiveBundles(product);
  const unitPrice = product.discountPrice || product.price;
  const unitOriginalPrice = product.discountPrice ? product.price : null;

  const validQty = Math.max(1, quantity || 1);

  // 1. If explicit bundle matches both ID and quantity
  if (selectedBundleId && effectiveBundles.length > 0) {
    const explicitBundle = effectiveBundles.find((b) => b.id === selectedBundleId);
    if (explicitBundle && explicitBundle.quantity === validQty) {
      return {
        totalPrice: explicitBundle.price,
        originalPrice: explicitBundle.originalPrice || (unitOriginalPrice ? unitOriginalPrice * validQty : null),
        activeBundle: explicitBundle,
        activeBundleId: explicitBundle.id,
        isCustomQuantity: false
      };
    }
  }

  // 2. If any bundle has exactly this quantity
  if (effectiveBundles.length > 0) {
    const exactBundle = effectiveBundles.find((b) => b.quantity === validQty);
    if (exactBundle) {
      return {
        totalPrice: exactBundle.price,
        originalPrice: exactBundle.originalPrice || (unitOriginalPrice ? unitOriginalPrice * validQty : null),
        activeBundle: exactBundle,
        activeBundleId: exactBundle.id,
        isCustomQuantity: false
      };
    }
  }

  // 3. If quantity exceeds the highest tier bundle
  if (effectiveBundles.length > 0) {
    const sorted = [...effectiveBundles].sort((a, b) => b.quantity - a.quantity);
    const maxBundle = sorted[0];

    if (validQty > maxBundle.quantity) {
      // Calculate bulk price pro-rated from highest tier package offer
      const perPieceRate = maxBundle.price / maxBundle.quantity;
      const calculatedPrice = Math.round(perPieceRate * validQty);

      let calcOrigPrice: number | null = null;
      if (maxBundle.originalPrice) {
        calcOrigPrice = Math.round((maxBundle.originalPrice / maxBundle.quantity) * validQty);
      } else if (unitOriginalPrice) {
        calcOrigPrice = unitOriginalPrice * validQty;
      }

      return {
        totalPrice: calculatedPrice,
        originalPrice: calcOrigPrice,
        activeBundle: undefined,
        activeBundleId: '',
        isCustomQuantity: true
      };
    }
  }

  // 4. Fallback: Standard unit price multiplication
  const standardPrice = unitPrice * validQty;
  const standardOrig = unitOriginalPrice ? unitOriginalPrice * validQty : null;

  return {
    totalPrice: standardPrice,
    originalPrice: standardOrig,
    activeBundle: undefined,
    activeBundleId: '',
    isCustomQuantity: true
  };
}

