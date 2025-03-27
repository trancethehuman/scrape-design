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
  screenshot?: string; // Base64 encoded screenshot if requested
  error?: string;
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
      return await handleScreenshotRequest(validatedOptions, apiKey);
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

    // For HTML or JSON responses
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(response);
      return {
        success: true,
        data: jsonData,
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
      };
    }
  } catch (error) {
    console.error("Scraper SDK error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Helper function to handle screenshot requests using the direct API
 */
async function handleScreenshotRequest(
  options: ScraperOptions,
  apiKey: string
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

    // Make request with full response to get access to headers
    const response = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Screenshot request failed: ${response.status} ${errorText}`
      );
    }

    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Check for the sa-screenshot header which contains the screenshot URL
    const screenshotUrl = response.headers.get("sa-screenshot");

    if (screenshotUrl) {
      console.log("Found screenshot URL in headers:", screenshotUrl);

      // Fetch the actual screenshot from the URL
      const imageResponse = await fetch(screenshotUrl, {
        cache: "no-store",
      });

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch screenshot from ${screenshotUrl}`);
      }

      const contentType =
        imageResponse.headers.get("content-type") || "image/png";
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const dataUrl = `data:${contentType};base64,${base64Image}`;

      return {
        success: true,
        screenshot: dataUrl,
      };
    }

    // Get content type from headers
    const contentType = response.headers.get("content-type") || "";

    // If there's no screenshot URL in headers but the response is an image, use that
    if (contentType.includes("image")) {
      console.log("Response is an image, using as screenshot");
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const dataUrl = `data:${contentType};base64,${base64Image}`;

      return {
        success: true,
        screenshot: dataUrl,
      };
    }

    // If we didn't get an image, try to parse the response
    const responseText = await response.text();
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(responseText);
      return {
        success: true,
        data: jsonData,
      };
    } catch (e) {
      // If not JSON, return as text
      return {
        success: true,
        data: responseText,
      };
    }
  } catch (error) {
    console.error("Screenshot request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
