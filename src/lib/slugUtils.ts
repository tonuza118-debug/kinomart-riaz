import { Product } from '../types';

/**
 * Generate a clean URL slug from a product's name
 */
export const getProductSlug = (product: Product): string => {
  if (!product) return '';
  if (!product.name) return product.id || '';

  // Convert product name into a clean slug, keeping Bengali & English characters
  const slug = product.name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-\u0980-\u09FF]/g, '')
    .replace(/-+/g, '-');

  return slug || product.id || '';
};

/**
 * Find product by slug, ID, or raw name from URL parameter
 */
export const findProductBySlugOrId = (products: Product[], param: string): Product | undefined => {
  if (!param) return undefined;
  const decoded = decodeURIComponent(param).trim().toLowerCase();

  return products.find((p) => {
    if (!p) return false;
    const pId = (p.id || '').toLowerCase();
    const pName = (p.name || '').trim().toLowerCase();
    const pSlug = getProductSlug(p).toLowerCase();

    return (
      pId === decoded ||
      pSlug === decoded ||
      pName === decoded ||
      pName.replace(/[\s_]+/g, '-') === decoded
    );
  });
};
