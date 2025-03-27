"use server";

import { z } from "zod";
import scraperApiSdk from "scraperapi-sdk";

/**
 * Schema to validate scraper options
 */
const scraperOptionsSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  screenshot: z.boolean().optional().default(false),
  renderJs: z.boolean().optional().default(true),
  premium: z.boolean().optional().default(false),
  ultraPremium: z.boolean().optional().default(false),
  device: z.enum(["desktop", "mobile", "tablet"]).optional().default("desktop"),
  autoScroll: z.boolean().optional().default(false),
  country: z.string().optional(),
  waitFor: z.number().optional(), // Wait time in milliseconds
});

type ScraperOptions = z.infer<typeof scraperOptionsSchema>;

/**
 * Response shape from the scraper action
 */
interface ScraperResponse {
  success: boolean;
  data?: any;
  screenshot?: string; // For base64 data (legacy support)
  screenshotUrl?: string; // For direct URL to screenshot
  error?: string;
  processingTime?: number;
}

/**
 * Server action to call ScraperAPI with configurable options using the SDK
 *
 * @param options Configuration options for the scraping request
 * @returns Response with scraped data or screenshot
 */
export async function scrapeWebsite(
  options: ScraperOptions
): Promise<ScraperResponse> {
  const startTime = performance.now();
  try {
    // Validate options
    const validatedOptions = scraperOptionsSchema.parse(options);

    // Get API key from environment variables
    const apiKey = process.env.SCRAPER_API_KEY;

    if (!apiKey) {
      throw new Error(
        "API key not found in environment variables. Please add SCRAPER_API_KEY to your .env.local file."
      );
    }

    // For screenshots, we need to use the direct API instead of the SDK
    if (validatedOptions.screenshot) {
      return await handleScreenshotRequest(validatedOptions, apiKey, startTime);
    }

    // Initialize the ScraperAPI SDK with the API key for non-screenshot requests
    const scraperapiClient = scraperApiSdk(apiKey);

    // Prepare parameters for the SDK
    const sdkParams: Record<string, any> = {};

    if (!validatedOptions.renderJs) {
      sdkParams.render = false;
    }

    if (validatedOptions.premium) {
      sdkParams.premium = true;
    }

    if (validatedOptions.ultraPremium) {
      sdkParams.ultra_premium = true;
    }

    if (validatedOptions.device && validatedOptions.device !== "desktop") {
      sdkParams.device = validatedOptions.device;
    }

    if (validatedOptions.autoScroll) {
      sdkParams.autoScroll = true;
    }

    if (validatedOptions.country) {
      sdkParams.country_code = validatedOptions.country;
    }

    if (validatedOptions.waitFor) {
      sdkParams.wait_for = validatedOptions.waitFor;
    }

    console.log(
      `Making request to ScraperAPI SDK for URL: ${validatedOptions.url}`
    );
    console.log(`Parameters: ${JSON.stringify(sdkParams)}`);

    // Make the request using the SDK
    const response = await scraperapiClient.get(
      validatedOptions.url,
      sdkParams
    );

    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000;

    // For HTML or JSON responses
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(response);
      return {
        success: true,
        data: jsonData,
        processingTime,
      };
    } catch (e) {
      // If not JSON, treat as HTML or text
      // Truncate the HTML if it's too large (prevents response size issues)
      const maxLength = 200000; // Approximately 200KB of text
      const truncated = response.length > maxLength;
      const data = truncated
        ? response.substring(0, maxLength) +
          "... [Content truncated due to size]"
        : response;

      return {
        success: true,
        data: data,
        processingTime,
      };
    }
  } catch (error) {
    console.error("Scraper SDK error:", error);
    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000;

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      processingTime,
    };
  }
}

/**
 * Helper function to handle screenshot requests using the direct API
 */
async function handleScreenshotRequest(
  options: ScraperOptions,
  apiKey: string,
  startTime: number
): Promise<ScraperResponse> {
  try {
    // Build the API URL with parameters
    const params = new URLSearchParams();
    params.append("api_key", apiKey);
    params.append("url", options.url);
    params.append("screenshot", "true");

    // Add additional parameters
    if (!options.renderJs) {
      params.append("render", "false");
    }

    if (options.premium) {
      params.append("premium", "true");
    }

    if (options.ultraPremium) {
      params.append("ultra_premium", "true");
    }

    if (options.device && options.device !== "desktop") {
      params.append("device", options.device);
    }

    if (options.autoScroll) {
      params.append("autoScroll", "true");
    }

    if (options.country) {
      params.append("country_code", options.country);
    }

    if (options.waitFor) {
      params.append("wait_for", options.waitFor.toString());
    }

    const apiUrl = `https://api.scraperapi.com/?${params.toString()}`;
    console.log(
      `Making screenshot request to ScraperAPI for URL: ${options.url}`
    );

    // Instead of converting the image to base64, we'll just return the URL
    // Check for the screenshot header which contains the URL to the screenshot
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Screenshot request failed: ${response.status} ${errorText}`
      );
    }

    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000;

    // Check for header that contains screenshot URL
    const screenshotUrl = response.headers.get("sa-screenshot");
    console.log(
      "Response headers:",
      Object.fromEntries([...response.headers.entries()])
    );
    console.log("Screenshot URL from header:", screenshotUrl);

    if (screenshotUrl) {
      // If we have a URL in the header, return that
      return {
        success: true,
        screenshotUrl: screenshotUrl,
        processingTime,
      };
    }

    // Handle the case where the response is the image itself
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("image")) {
      // If we get a direct image, we need to handle it differently since we need a URL, not base64
      // We'll create a direct URL to ScraperAPI with the same parameters
      const screenshotUrl = apiUrl; // Use the same API URL as a direct link to the image
      return {
        success: true,
        screenshotUrl: screenshotUrl, // Return the URL directly
        screenshot: `data:${contentType};base64,${Buffer.from(
          await response.arrayBuffer()
        ).toString("base64")}`, // Legacy support
        processingTime,
      };
    }

    // If we didn't get an image or a screenshot URL, try to parse the response
    const responseText = await response.text();
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(responseText);
      return {
        success: true,
        data: jsonData,
        processingTime,
      };
    } catch (e) {
      // If not JSON, return as text
      return {
        success: true,
        data: responseText,
        processingTime,
      };
    }
  } catch (error) {
    console.error("Screenshot request error:", error);
    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000;

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      processingTime,
    };
  }
}
