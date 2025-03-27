"use server";

import scraperApiSdk from "scraperapi-sdk";

/**
 * A simple test function to verify the ScraperAPI SDK is working correctly
 * This action makes a basic request to httpbin.org
 */
export async function testScraperSdk() {
  try {
    const apiKey = process.env.SCRAPER_API_KEY;

    if (!apiKey) {
      throw new Error("API key not found in environment variables");
    }

    const scraperapiClient = scraperApiSdk(apiKey);
    console.log("Initialized ScraperAPI client");

    // Make a simple request to httpbin.org as shown in the documentation
    const response = await scraperapiClient.get("http://httpbin.org/ip");
    console.log("ScraperAPI SDK test response:", response);

    return {
      success: true,
      message: "ScraperAPI SDK integration test successful",
      data: response,
    };
  } catch (error) {
    console.error("ScraperAPI SDK test error:", error);
    return {
      success: false,
      message: "ScraperAPI SDK integration test failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
