"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { stripCodeBlockMarkers } from "@/lib/utils";

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
  debugInfo?: any;
}

export async function generateComponent(
  input: z.infer<typeof generateComponentInputSchema>
): Promise<GenerateComponentResponse> {
  try {
    // Validate input data
    console.log("Input received:", {
      url: input.url,
      htmlContentType: typeof input.htmlContent,
      htmlContentLength: input.htmlContent?.length,
      hasScreenshotUrl: !!input.screenshotUrl,
      startTime: input.startTime,
    });

    const { url, htmlContent, screenshotUrl, startTime } =
      generateComponentInputSchema.parse(input);

    // Create the prompt for the AI model
    const promptText = `
You are a web developer and see a website and redesign it as a React component using shadcn/ui components.

It has to look like the original website.

Create a React component to start with (call it Preview), then inside:
1. Uses only shadcn/ui components (Button, Card, Input, etc.)
2. Creates a clean, modern version of this website
3. Preserves the main content, layout and functionality
4. Includes all text content but styled better
5. Uses proper TypeScript and Tailwind CSS
6. Do not write the backticks in the code
7. Do not import any components from shadcn/ui, just use the components directly in the code. Start with the function declaration for the main component.
8. Do not write export at the end of the file, just write the component code.
9. The page should be a component, and the component name should always be Preview. Look at the example below for the correct syntax.
10. Make sure to represent the whole page, and design it nicely according to good design practices.



Here's an example of a working page as Preview component:
<example>
// Define the Preview component
function Preview() {
  // Access mock data
  const { user } = mockData;
  
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Profile Card</CardTitle>
        <p className="text-sm text-muted-foreground">
          View and manage your profile information
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="grid gap-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" defaultValue={user.bio} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" defaultValue={user.location} />
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
}
</example>

Return ONLY the complete React component code with no explanations or comments.
`;

    // Call the AI model with or without image based on whether we have a screenshot URL
    console.log("Using screenshot URL:", screenshotUrl);

    let result;

    try {
      if (screenshotUrl) {
        // With image
        console.log("Making multimodal request with image URL");
        result = await generateText({
          model: google("gemini-2.0-flash"),
          maxTokens: 80000,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
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
          prompt: promptText,
        });
      }
    } catch (aiError) {
      console.error("AI SDK error:", aiError);
      return {
        success: false,
        error: aiError instanceof Error ? aiError.message : "AI model error",
        debugInfo: aiError,
      };
    }

    // Calculate processing time
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    return {
      success: true,
      code: stripCodeBlockMarkers(result.text),
      processingTime,
    };
  } catch (error) {
    console.error("Error generating component:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      debugInfo: error,
    };
  }
}
