import type { BetterFetchOption } from '@better-fetch/fetch';

// Global type declarations for WeWeb

declare global {
    const wwLib: any;
    const userflow: any;
    type WwServerRequestOptions<T = unknown> = BetterFetchOption<
        unknown,
        Record<string, unknown>,
        Record<string, unknown> | Array<string> | undefined,
        T
    >;
    function wwServerClient<T = unknown>(url: string, options?: WwServerRequestOptions<T>): Promise<T>;
    interface Window {
        wwLib: typeof wwLib;
        userflow: typeof userflow;
        wwServerClient: typeof wwServerClient;
    }
}

export {};
