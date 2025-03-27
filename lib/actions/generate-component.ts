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
6. Do not write the backticks in the code
7. Do not import any components from shadcn/ui, just use the components directly in the code. Start with the function declaration for the main component.
8. Do not write export at the end of the file, just write the component code.
9. The component name should always be Prevew. Look at the example below for the correct syntax.

Here's an example of a working component:
<example>
// Define the Preview component
function Preview() {
  // Define products array directly in the component
  const items = [
    { id: 'product-1', name: 'Awesome T-Shirt', price: '$25.00' },
    { id: 'product-2', name: 'Cool Coffee Mug', price: '$15.00' },
  ];
  
  // Pre-calculate the total price to avoid any scope issues
  const priceSum = items.reduce((total, item) => {
    const price = parseFloat(item.price.replace('$', ''));
    return total + price;
  }, 0);
  
  const totalPrice = priceSum.toFixed(2);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Product Checkout</h2>
        <p className="text-muted-foreground">Complete your purchase</p>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Your Items</h3>
        <div className="border rounded-lg divide-y">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Checkbox id={item.id} />
                <Label htmlFor={item.id}>{item.name}</Label>
              </div>
              <div className="font-medium">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Payment Details</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name on card</Label>
            <Input id="name" placeholder="John Smith" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="card">Card number</Label>
            <Input id="card" placeholder="1234 5678 9012 3456" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry date</Label>
              <Input id="expiry" placeholder="MM/YY" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
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
