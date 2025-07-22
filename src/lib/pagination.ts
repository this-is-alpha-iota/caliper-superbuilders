import type { Context } from 'hono';

// ============================================
// Types and Interfaces
// ============================================

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  totalCount: number;
  hasMore: boolean;
  hasPrevious: boolean;
  nextOffset?: number;
  previousOffset?: number;
}

// ============================================
// Core Pagination Functions
// ============================================

/**
 * Extract and validate pagination parameters from query
 */
export function getPaginationParams(query: any): PaginationParams {
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;
  const MIN_LIMIT = 1;
  
  let limit = DEFAULT_LIMIT;
  let offset = 0;
  
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (!isNaN(parsedLimit)) {
      limit = Math.max(MIN_LIMIT, Math.min(parsedLimit, MAX_LIMIT));
    }
  }
  
  if (query.offset !== undefined) {
    const parsedOffset = parseInt(query.offset, 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      offset = parsedOffset;
    }
  }
  
  return { limit, offset };
}

/**
 * Build pagination metadata from query results
 */
export function buildPaginationMeta(
  params: PaginationParams,
  totalCount: number
): PaginationMeta {
  const { limit, offset } = params;
  const hasMore = offset + limit < totalCount;
  const hasPrevious = offset > 0;
  
  return {
    limit,
    offset,
    totalCount,
    hasMore,
    hasPrevious,
    nextOffset: hasMore ? offset + limit : undefined,
    previousOffset: hasPrevious ? Math.max(0, offset - limit) : undefined,
  };
}

/**
 * Build Link header value for pagination navigation
 * Compliant with RFC 5988
 */
export function buildLinkHeader(
  baseUrl: string,
  path: string,
  query: Record<string, any>,
  meta: PaginationMeta
): string {
  const links: string[] = [];
  
  // Helper to build URL with query params
  const buildUrl = (overrides: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    
    // Include all original query params except pagination
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'limit' && key !== 'offset' && value !== undefined) {
        params.append(key, String(value));
      }
    });
    
    // Add pagination params with overrides
    const finalParams = {
      limit: meta.limit,
      offset: meta.offset,
      ...overrides,
    };
    
    Object.entries(finalParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
  };
  
  // First link (offset=0)
  links.push(`<${buildUrl({ offset: 0 })}>; rel="first"`);
  
  // Previous link
  if (meta.hasPrevious && meta.previousOffset !== undefined) {
    links.push(`<${buildUrl({ offset: meta.previousOffset })}>; rel="prev"`);
  }
  
  // Next link
  if (meta.hasMore && meta.nextOffset !== undefined) {
    links.push(`<${buildUrl({ offset: meta.nextOffset })}>; rel="next"`);
  }
  
  // Last link
  const lastOffset = Math.max(0, Math.floor((meta.totalCount - 1) / meta.limit) * meta.limit);
  links.push(`<${buildUrl({ offset: lastOffset })}>; rel="last"`);
  
  return links.join(', ');
}

/**
 * Apply pagination headers to the response
 * Adds Link header and optional custom headers
 */
export function applyPaginationHeaders(
  c: Context,
  meta: PaginationMeta,
  path: string
): void {
  const proto = c.req.header('x-forwarded-proto') || 'http';
  const host = c.req.header('host') || 'localhost:3000';
  const baseUrl = `${proto}://${host}`;
  
  // Build and set Link header
  const linkHeader = buildLinkHeader(
    baseUrl,
    path,
    c.req.query(),
    meta
  );
  
  c.header('Link', linkHeader);
  
  // Add custom pagination headers for convenience
  c.header('X-Total-Count', String(meta.totalCount));
  c.header('X-Limit', String(meta.limit));
  c.header('X-Offset', String(meta.offset));
  c.header('X-Has-More', String(meta.hasMore));
} 