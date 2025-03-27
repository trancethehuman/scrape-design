declare module "scraperapi-sdk" {
  interface ScraperClient {
    get(url: string, params?: Record<string, any>): Promise<any>;
    post(url: string, data?: any, params?: Record<string, any>): Promise<any>;
    put(url: string, data?: any, params?: Record<string, any>): Promise<any>;
    delete(url: string, params?: Record<string, any>): Promise<any>;
    patch(url: string, data?: any, params?: Record<string, any>): Promise<any>;
  }

  export default function (apiKey: string): ScraperClient;
}
