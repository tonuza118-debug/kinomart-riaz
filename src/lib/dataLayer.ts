import { Product, Order, OrderItem } from '../types';

// Ensure dataLayer and fbq exist on window
declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
    fbq?: any;
    _fbq?: any;
    gtag?: any;
  }
}

/**
 * Deduplication store for purchase transactions to prevent duplicate firing
 */
const trackedTransactions = new Set<string>();

/**
 * Initialize window.dataLayer if not present
 */
export const initDataLayer = (): Record<string, any>[] => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  }
  return [];
};

// Initialize immediately on bundle load
if (typeof window !== 'undefined') {
  initDataLayer();
}

/**
 * Helper to safely push events to window.dataLayer with debug logging
 */
export const pushToDataLayer = (data: Record<string, any>): void => {
  try {
    if (typeof window === 'undefined') return;
    const dl = initDataLayer();
    dl.push(data);
    
    // Developer console log for real-time tracking verification
    if (data.event) {
      console.log(`%c[DataLayer] 🚀 Event: ${data.event}`, 'color: #10B981; font-weight: bold;', data);
    }
  } catch (err) {
    console.warn('[DataLayer Warning] Failed to push event:', err);
  }
};

/**
 * Helper to format product into standard GA4 item structure
 */
export const formatGA4Item = (
  product?: Product,
  quantity: number = 1,
  selectedColor?: string,
  index?: number
) => {
  if (!product) {
    return {
      item_id: '',
      item_name: '',
      price: 0,
      quantity: quantity,
    };
  }
  const price = product.discountPrice || product.price || 0;
  return {
    item_id: String(product.id || ''),
    item_name: product.name || '',
    price: price,
    quantity: quantity,
    item_category: product.category || 'গ্যাজেট',
    item_category2: product.subCategory || undefined,
    item_variant: selectedColor || (product.colors && product.colors[0]) || undefined,
    index: typeof index === 'number' ? index : undefined,
  };
};

/**
 * Dynamic GTM (Google Tag Manager) Script Injector
 */
export const injectGTM = (gtmId: string): void => {
  if (typeof window === 'undefined' || !gtmId || !gtmId.trim().startsWith('GTM-')) return;
  const cleanId = gtmId.trim();
  if (document.getElementById(`gtm-script-${cleanId}`)) return;

  try {
    initDataLayer();
    const script = document.createElement('script');
    script.id = `gtm-script-${cleanId}`;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${cleanId}`;
    document.head.appendChild(script);

    // Initial gtm.start event
    pushToDataLayer({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });
    console.log(`[GTM] Injected container: ${cleanId}`);
  } catch (e) {
    console.warn('[GTM] Failed to inject script:', e);
  }
};

/**
 * Dynamic GA4 (Google Analytics 4) Measurement Script Injector
 */
export const injectGA4 = (gaMeasurementId: string): void => {
  if (typeof window === 'undefined' || !gaMeasurementId || !gaMeasurementId.trim().startsWith('G-')) return;
  const cleanId = gaMeasurementId.trim();
  if (document.getElementById(`ga4-script-${cleanId}`)) return;

  try {
    initDataLayer();
    const script = document.createElement('script');
    script.id = `ga4-script-${cleanId}`;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${cleanId}`;
    document.head.appendChild(script);

    window.gtag = window.gtag || function () {
      initDataLayer().push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', cleanId);
    console.log(`[GA4] Injected measurement ID: ${cleanId}`);
  } catch (e) {
    console.warn('[GA4] Failed to inject script:', e);
  }
};

/**
 * Dynamic Meta Pixel (Facebook Pixel) Script Injector
 */
export const injectMetaPixel = (pixelId: string): void => {
  if (typeof window === 'undefined' || !pixelId || pixelId.trim().length < 5) return;
  const cleanId = pixelId.trim();
  if (document.getElementById(`meta-pixel-${cleanId}`)) return;

  try {
    /* eslint-disable */
    if (!window.fbq) {
      const fbq: any = function () {
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = fbq;

      const script = document.createElement('script');
      script.id = `meta-pixel-${cleanId}`;
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    /* eslint-enable */

    window.fbq('init', cleanId);
    window.fbq('track', 'PageView');
    console.log(`[Meta Pixel] Initialized Pixel ID: ${cleanId}`);
  } catch (e) {
    console.warn('[Meta Pixel] Failed to inject script:', e);
  }
};

/**
 * 1. page_view Event
 */
export const trackPageView = (
  pageTitle?: string,
  pageLocation?: string,
  pagePath?: string
): void => {
  try {
    pushToDataLayer({
      event: 'page_view',
      page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      page_location: pageLocation || (typeof window !== 'undefined' ? window.location.href : ''),
      page_path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
    });

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  } catch (err) {
    console.warn('[DataLayer Warning] trackPageView error:', err);
  }
};

/**
 * 2. view_item_list Event (When a list of products is viewed)
 */
export const trackViewItemList = (
  products: Product[],
  itemListName: string = 'Product Grid'
): void => {
  try {
    if (!products || products.length === 0) return;
    const items = products.slice(0, 20).map((p, idx) => formatGA4Item(p, 1, undefined, idx + 1));
    pushToDataLayer({
      event: 'view_item_list',
      ecommerce: {
        item_list_name: itemListName,
        items: items,
      },
    });
  } catch (err) {
    console.warn('[DataLayer Warning] trackViewItemList error:', err);
  }
};

/**
 * 3. select_item Event (When user clicks on a product card)
 */
export const trackSelectItem = (
  product: Product,
  itemListName: string = 'Product Grid',
  index?: number
): void => {
  try {
    if (!product) return;
    const item = formatGA4Item(product, 1, undefined, index);
    pushToDataLayer({
      event: 'select_item',
      ecommerce: {
        item_list_name: itemListName,
        items: [item],
      },
    });
  } catch (err) {
    console.warn('[DataLayer Warning] trackSelectItem error:', err);
  }
};

/**
 * 4. view_item Event (When product details page opens)
 */
export const trackViewItem = (
  product: Product,
  quantity: number = 1,
  selectedColor?: string
): void => {
  try {
    if (!product) return;
    const item = formatGA4Item(product, quantity, selectedColor);
    const value = item.price * quantity;

    pushToDataLayer({
      event: 'view_item',
      ecommerce: {
        currency: 'BDT',
        value: value,
        items: [item],
      },
    });

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [String(product.id)],
        content_type: 'product',
        value: value,
        currency: 'BDT'
      });
    }
  } catch (err) {
    console.warn('[DataLayer Warning] trackViewItem error:', err);
  }
};

/**
 * 5. add_to_cart Event
 */
export const trackAddToCart = (
  product: Product,
  quantity: number = 1,
  selectedColor?: string
): void => {
  try {
    if (!product) return;
    const item = formatGA4Item(product, quantity, selectedColor);
    const value = item.price * quantity;

    pushToDataLayer({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'BDT',
        value: value,
        items: [item],
      },
    });

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [String(product.id)],
        content_type: 'product',
        value: value,
        currency: 'BDT'
      });
    }
  } catch (err) {
    console.warn('[DataLayer Warning] trackAddToCart error:', err);
  }
};

/**
 * 6. remove_from_cart Event
 */
export const trackRemoveFromCart = (
  product: Product,
  quantity: number = 1,
  selectedColor?: string
): void => {
  try {
    if (!product) return;
    const item = formatGA4Item(product, quantity, selectedColor);
    pushToDataLayer({
      event: 'remove_from_cart',
      ecommerce: {
        currency: 'BDT',
        value: item.price * quantity,
        items: [item],
      },
    });
  } catch (err) {
    console.warn('[DataLayer Warning] trackRemoveFromCart error:', err);
  }
};

/**
 * 7. begin_checkout Event
 */
export const trackBeginCheckout = (
  items: { product: Product; quantity: number; selectedColor?: string }[],
  value: number,
  couponCode?: string
): void => {
  try {
    const formattedItems = (items || []).map((i) =>
      formatGA4Item(i.product, i.quantity, i.selectedColor)
    );

    pushToDataLayer({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'BDT',
        value: value,
        coupon: couponCode || undefined,
        items: formattedItems,
      },
    });

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: (items || []).map(i => String(i.product.id)),
        contents: formattedItems.map(f => ({ id: f.item_id, quantity: f.quantity, item_price: f.price })),
        num_items: (items || []).reduce((sum, i) => sum + i.quantity, 0),
        value: value,
        currency: 'BDT'
      });
    }
  } catch (err) {
    console.warn('[DataLayer Warning] trackBeginCheckout error:', err);
  }
};

/**
 * 8. purchase Event
 * Deduplicated by transaction_id to ensure it fires only once per order.
 */
export const trackPurchase = (order: Order): void => {
  try {
    if (!order) return;
    const transactionId = order.orderNumber || order.id;

    if (!transactionId) return;

    // Prevent duplicate purchase events
    if (trackedTransactions.has(transactionId)) {
      console.log(`[DataLayer] Purchase event for order ${transactionId} already tracked. Skipping duplicate.`);
      return;
    }

    trackedTransactions.add(transactionId);

    const formattedItems = (order.items || []).map((orderItem: OrderItem) =>
      formatGA4Item(
        orderItem.product,
        orderItem.quantity,
        orderItem.selectedColor
      )
    );

    pushToDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: transactionId,
        value: order.totalPrice,
        tax: 0,
        shipping: order.deliveryFee || 0,
        currency: 'BDT',
        coupon: order.couponCode || undefined,
        items: formattedItems,
      },
    });

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: (order.items || []).map(i => String(i.product?.id || '')),
        contents: formattedItems.map(f => ({ id: f.item_id, quantity: f.quantity, item_price: f.price })),
        num_items: (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0),
        value: order.totalPrice,
        currency: 'BDT'
      });
    }
  } catch (err) {
    console.warn('[DataLayer Warning] trackPurchase error:', err);
  }
};
