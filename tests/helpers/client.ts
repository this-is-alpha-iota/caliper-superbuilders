/**
 * API client helper for Caliper API testing
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_API_KEY = process.env.TEST_API_KEY || 'test-key';

// Try to load API key from .auth-token file
let authToken: string | null = null;
try {
  const tokenFile = Bun.file('.auth-token');
  if (tokenFile.size > 0) {
    authToken = (await tokenFile.text()).trim();
  }
} catch {
  // File doesn't exist or can't be read
}

interface ApiClientOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  apiKey?: string;
}

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  headers: Headers;
}

/**
 * Make an API request
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit & ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth, apiKey, headers = {}, ...fetchOptions } = options;
  
  // Add auth header if not skipping
  if (!skipAuth && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    headers['Authorization'] = `Bearer ${apiKey || authToken || TEST_API_KEY}`;
  }
  
  // Always add content-type for JSON requests
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      redirect: 'manual', // Don't follow redirects automatically
    });
    
    const responseText = await response.text();
    let data: T | null = null;
    
    // Try to parse as JSON
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        // If not JSON, return as is
        data = responseText as any;
      }
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: data, // Return data regardless of status
      error: !response.ok ? (data as any)?.error || (data as any)?.message || responseText : null,
      headers: response.headers,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      headers: new Headers(),
    };
  }
}

/**
 * Helper to create a valid Caliper envelope
 */
export function createEnvelope(events: any[] = [createViewEvent()]) {
  return {
    sensor: 'https://example.edu/sensors/1',
    sendTime: new Date().toISOString(),
    dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    data: events,
  };
}

/**
 * Helper to create a valid ViewEvent
 */
export function createViewEvent(overrides: any = {}) {
  return {
    '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    id: `urn:uuid:${Date.now()}-${Math.random()}`,
    type: 'ViewEvent',
    actor: {
      id: 'https://example.edu/users/554433',
      type: 'Person',
    },
    action: 'Viewed',
    object: {
      id: 'https://example.edu/terms/201801/courses/7/sections/1/pages/2',
      type: 'Page',
      name: 'Introduction to Physics',
    },
    eventTime: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create other event types
 */
export function createAssessmentEvent(overrides: any = {}) {
  return {
    '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    id: `urn:uuid:${Date.now()}-${Math.random()}`,
    type: 'AssessmentEvent',
    actor: {
      id: 'https://example.edu/users/554433',
      type: 'Person',
    },
    action: 'Started',
    object: {
      id: 'https://example.edu/assessments/1',
      type: 'Assessment',
      name: 'Quiz 1',
    },
    eventTime: new Date().toISOString(),
    ...overrides,
  };
} 