"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

// Define input schema
const generateComponentInputSchema = z.object({
  url: z.string().url(),
  htmlContent: z.string(),
  screenshotUrl: z.string().url().optional(),
  startTime: z.number(),
});

// Define response type
export interface GenerateComponentResponse {
  success: boolean;
  code?: string;
  error?: string;
  processingTime?: number;
}

export async function generateComponent(
  input: z.infer<typeof generateComponentInputSchema>
): Promise<GenerateComponentResponse> {
  try {
    // Validate input data
    const { url, htmlContent, screenshotUrl, startTime } =
      generateComponentInputSchema.parse(input);

    // Create the prompt for the AI model
    const prompt = `
You are a web developer converting a scraped website into a React component using shadcn/ui components.

The website I want to convert is: ${url}

Here is the HTML content of the page:
\`\`\`html
${htmlContent.substring(0, 10000)}
\`\`\`

Create a React component that:
1. Uses only shadcn/ui components (Button, Card, Input, etc.)
2. Creates a clean, modern version of this website
3. Preserves the main content, layout and functionality
4. Includes all text content but styled better
5. Uses proper TypeScript and Tailwind CSS

Return ONLY the complete React component code with no explanations or comments. The component should be client-side and start with "use client";
`;

    // Call the AI model with or without image based on whether we have a screenshot URL
    console.log("Using screenshot URL:", screenshotUrl);

    let result;

    if (screenshotUrl) {
      // With image
      console.log("Making multimodal request with image URL");
      result = await generateText({
        model: google("gemini-2.0-flash"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: screenshotUrl },
            ],
          },
        ],
      });
    } else {
      // Text only
      console.log("Making text-only request");
      result = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: prompt,
      });
    }

    // Calculate processing time
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    return {
      success: true,
      code: result.text,
      processingTime,
    };
  } catch (error) {
    console.error("Error generating component:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
