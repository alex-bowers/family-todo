const endpoint = import.meta.env.PUBLIC_HASURA_GRAPHQL_ENDPOINT;
const role = import.meta.env.PUBLIC_HASURA_ROLE;
const adminSecret = import.meta.env.HASURA_GRAPHQL_ADMIN_SECRET;
const REQUEST_TIMEOUT_MS = 10_000;

function isSecureEndpoint(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol === 'https:') {
      return true;
    }

    if (parsed.protocol !== 'http:') {
      return false;
    }

    // Allow localhost-style HTTP endpoints for local development only.
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

if (adminSecret && typeof window !== 'undefined') {
  console.warn('HASURA_GRAPHQL_ADMIN_SECRET is set in client context; this should remain server-side only.');
}

type GraphQLVariables = Record<string, unknown>;

interface GraphQLErrorItem {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

interface GraphQLResult<TData> {
  data?: TData;
  errors?: GraphQLErrorItem[];
}

export class HasuraClient {
  constructor(
    private readonly url: string,
    private readonly defaultHeaders: HeadersInit = {}
  ) {}

  async request<TData, TVariables extends GraphQLVariables = GraphQLVariables>(
    query: string,
    variables?: TVariables,
    extraHeaders: HeadersInit = {}
  ): Promise<TData> {
    if (!query.trim()) {
      throw new Error('GraphQL request failed: query is required');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...this.defaultHeaders,
          ...extraHeaders
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('GraphQL request failed: request timed out');
      }
      throw new Error('GraphQL request failed: network error');
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json()) as GraphQLResult<TData>;

    if (!response.ok || payload.errors?.length) {
      const firstError = payload.errors?.[0]?.message ?? response.statusText;
      throw new Error(`GraphQL request failed: ${firstError}`);
    }

    if (!payload.data) {
      throw new Error('GraphQL request completed without data');
    }

    return payload.data;
  }
}

export const hasuraClient = endpoint
  ? isSecureEndpoint(endpoint)
    ? new HasuraClient(endpoint, {
      ...(role ? { 'x-hasura-role': role } : {})
    })
    : null
  : null;

export function hasuraConfigured(): boolean {
  return Boolean(endpoint && isSecureEndpoint(endpoint));
}
