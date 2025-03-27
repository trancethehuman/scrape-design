"use client";

import { useState, useEffect } from "react";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, CheckCircle2, History } from "lucide-react";
import { examples } from "@/lib/examples";
import Link from "next/link";
import { scrapeWebsite } from "@/lib/actions/scraper";
import { generateComponent } from "@/lib/actions/generate-component";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Status tracking for each generation step
type StepStatus = "idle" | "loading" | "complete" | "error";

interface StatusHistory {
  content: StepStatus;
  screenshot: StepStatus;
  ai: StepStatus;
  timestamp: number;
}

export default function Home() {
  const [code, setCode] = useState(examples.button.code);
  const [activeTab, setActiveTab] = useState("editor");
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapeDuration, setScrapeDuration] = useState<number | null>(null);
  const [aiDuration, setAiDuration] = useState<number | null>(null);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [currentScreenshotUrl, setCurrentScreenshotUrl] = useState<
    string | undefined
  >();

  // Step status tracking
  const [contentStatus, setContentStatus] = useState<StepStatus>("idle");
  const [screenshotStatus, setScreenshotStatus] = useState<StepStatus>("idle");
  const [aiStatus, setAiStatus] = useState<StepStatus>("idle");

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  // Handle cancellation of generation
  const cancelGeneration = () => {
    setIsGenerating(false);
    setContentStatus("idle");
    setScreenshotStatus("idle");
    setAiStatus("idle");
    setError("Generation cancelled by user");
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGenerating && url) {
      generateWebsite();
    }
  };

  // Load Babel standalone script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@babel/standalone/babel.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const regenerateAIComponent = async () => {
    if (!htmlContent) return;

    try {
      setAiStatus("loading");
      const aiStart = performance.now();

      const generationResult = await generateComponent({
        url,
        htmlContent,
        screenshotUrl: currentScreenshotUrl,
        startTime: Date.now(),
      }).finally(() => {
        const aiEnd = performance.now();
        setAiDuration((aiEnd - aiStart) / 1000);
      });

      setAiStatus(generationResult.success ? "complete" : "error");

      if (!generationResult.success) {
        throw new Error(
          generationResult.error || "Failed to generate component"
        );
      }

      setCode(generationResult.code || "");

      // Update status history for AI regeneration
      setStatusHistory((prev) => [
        ...prev,
        {
          content: "complete",
          screenshot: includeScreenshot ? "complete" : "idle",
          ai: generationResult.success ? "complete" : "error",
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.error("Error regenerating component:", err);
      setError(
        err instanceof Error ? err.message : "Failed to regenerate component"
      );
      setAiStatus("error");
    }
  };

  const generateWebsite = async () => {
    if (!url) {
      setError("Please enter a valid URL");
      return;
    }

    try {
      // Reset states
      setError(null);
      setIsGenerating(true);
      setContentStatus("loading");
      setScreenshotStatus(includeScreenshot ? "loading" : "idle");
      setAiStatus("idle");
      setHtmlContent(null);
      setCurrentScreenshotUrl(undefined);

      // Add initial status to history
      setStatusHistory((prev) => [
        ...prev,
        {
          content: "loading",
          screenshot: includeScreenshot ? "loading" : "idle",
          ai: "idle",
          timestamp: Date.now(),
        },
      ]);

      const startTime = performance.now();
      const scrapeStart = performance.now();

      // Prepare requests array - we always need content
      const requests = [
        // Content request
        scrapeWebsite({
          url,
          renderJs: true,
          premium: false,
          screenshot: false,
          ultraPremium: true,
          device: "desktop",
          autoScroll: false,
        })
          .then((response) => {
            setContentStatus(response.success ? "complete" : "error");
            return response;
          })
          .catch((err) => {
            console.error("Content scraping failed:", err);
            setContentStatus("error");
            throw err;
          }),
      ];

      // Add screenshot request only if includeScreenshot is true
      let screenshotResponse: {
        success: boolean;
        screenshotUrl?: string;
        error?: string;
      } = {
        success: false,
        screenshotUrl: undefined,
      };

      if (includeScreenshot) {
        requests.push(
          scrapeWebsite({
            url,
            screenshot: true,
            renderJs: true,
            premium: false,
            ultraPremium: true,
            device: "desktop",
            autoScroll: false,
          })
            .then((response) => {
              setScreenshotStatus(response.success ? "complete" : "error");
              return response;
            })
            .catch((err) => {
              console.error("Screenshot scraping failed:", err);
              setScreenshotStatus("error");
              // Return a minimal response object to continue without screenshot
              return {
                success: false,
                error: err instanceof Error ? err.message : "Screenshot failed",
                screenshotUrl: undefined,
              };
            })
        );
      }

      // Execute requests
      const responses = await Promise.all(requests);
      const contentResponse = responses[0];
      if (includeScreenshot && responses.length > 1) {
        screenshotResponse = responses[1];
      }

      const scrapeEnd = performance.now();
      setScrapeDuration((scrapeEnd - scrapeStart) / 1000);

      if (!contentResponse.success) {
        throw new Error(
          contentResponse.error || "Failed to scrape website content"
        );
      }

      const content = contentResponse.data;
      console.log("Content response:", contentResponse);
      if (includeScreenshot) {
        console.log("Screenshot response:", screenshotResponse);
      }

      // Make sure content is a string
      const htmlContentString =
        typeof content === "string" ? content : JSON.stringify(content);

      // Use server action to generate component with AI
      setAiStatus("loading");
      const aiStart = performance.now();

      // Safe access to the screenshotUrl which might not exist
      const screenshotUrl =
        includeScreenshot && screenshotResponse.success
          ? screenshotResponse.screenshotUrl
          : undefined;
      console.log("Screenshot URL:", screenshotUrl);

      const generationResult = await generateComponent({
        url,
        htmlContent: htmlContentString,
        screenshotUrl,
        startTime: Date.now(),
      }).finally(() => {
        const aiEnd = performance.now();
        setAiDuration((aiEnd - aiStart) / 1000);
      });

      setAiStatus(generationResult.success ? "complete" : "error");

      if (!generationResult.success) {
        throw new Error(
          generationResult.error || "Failed to generate component"
        );
      }

      setCode(generationResult.code || "");
      const endTime = performance.now();
      setTimeElapsed((endTime - startTime) / 1000); // Convert to seconds
      setActiveTab("editor"); // Switch to editor tab after generation

      // Update status history when content is complete
      setStatusHistory((prev) => [
        ...prev,
        {
          content: contentResponse.success ? "complete" : "error",
          screenshot: includeScreenshot ? "loading" : "idle",
          ai: "idle",
          timestamp: Date.now(),
        },
      ]);

      if (includeScreenshot) {
        // Update status history when screenshot is complete
        setStatusHistory((prev) => [
          ...prev,
          {
            content: "complete",
            screenshot: screenshotResponse.success ? "complete" : "error",
            ai: "idle",
            timestamp: Date.now(),
          },
        ]);
      }

      // Update status history when AI generation is complete
      setStatusHistory((prev) => [
        ...prev,
        {
          content: "complete",
          screenshot: includeScreenshot ? "complete" : "idle",
          ai: generationResult.success ? "complete" : "error",
          timestamp: Date.now(),
        },
      ]);

      // Store the content for potential regeneration
      setHtmlContent(htmlContentString);
      setCurrentScreenshotUrl(screenshotUrl);
    } catch (err) {
      console.error("Error generating website:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to render status indicator
  const renderStatusIndicator = (status: StepStatus, label: string) => {
    return (
      <div className="flex items-center text-xs py-1">
        {status === "loading" && (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-blue-500" />
        )}
        {status === "complete" && (
          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
        )}
        {status === "error" && (
          <span className="h-3.5 w-3.5 mr-2 text-red-500">⚠️</span>
        )}
        <span
          className={
            status === "complete"
              ? "text-green-700 font-medium"
              : status === "error"
              ? "text-red-700 font-medium"
              : status === "loading"
              ? "text-blue-700 font-medium"
              : "text-slate-600"
          }
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <main className="flex flex-col bg-slate-50 overflow-hidden h-screen">
      <header className="border-b bg-white shadow-sm shrink-0 h-14 z-10">
        <div className="w-full h-full px-4 flex items-center">
          <h1 className="text-xl font-bold text-slate-800">
            Website to Component
          </h1>
          <div className="ml-auto flex items-center space-x-3">
            <Link href="/scraper">
              <Button
                variant="outline"
                size="sm"
                className="text-slate-700 hover:text-slate-900"
              >
                Web Scraper
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCode(examples.button.code)}
              className="text-slate-700 hover:text-slate-900"
            >
              Button Example
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCode(examples.card.code)}
              className="text-slate-700 hover:text-slate-900"
            >
              Card Example
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCode(examples.form.code)}
              className="text-slate-700 hover:text-slate-900"
            >
              Form Example
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full bg-white border-b p-4 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-2">
          <form
            onSubmit={handleFormSubmit}
            className="flex items-end space-x-2"
          >
            <div className="flex-1">
              <Label htmlFor="url-input" className="text-sm font-medium">
                Enter URL to convert to shadcn/ui component
              </Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1"
                disabled={isGenerating}
              />
            </div>
            {isGenerating ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={cancelGeneration}
                  className="ml-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={regenerateAIComponent}
                  disabled={!htmlContent || aiStatus === "loading"}
                  className="flex items-center"
                >
                  <Loader2
                    className={cn(
                      "mr-2 h-4 w-4",
                      aiStatus === "loading" && "animate-spin"
                    )}
                  />
                  Regenerate AI
                </Button>
                <Button disabled className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </Button>
              </div>
            ) : (
              <Button type="submit" disabled={!url} className="ml-2">
                Generate Component
              </Button>
            )}
          </form>

          <div className="flex items-center space-x-2">
            <Switch
              id="screenshot-toggle"
              checked={includeScreenshot}
              onCheckedChange={setIncludeScreenshot}
              disabled={isGenerating}
            />
            <Label
              htmlFor="screenshot-toggle"
              className="text-sm text-slate-700"
            >
              Include screenshot for better results
            </Label>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">
                  Generation Progress
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-slate-100"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Status History</h4>
                      <div className="space-y-2">
                        {statusHistory.map((status, index) => (
                          <div
                            key={index}
                            className="text-xs space-y-1 p-2 rounded bg-slate-50"
                          >
                            <div className="flex items-center justify-between text-slate-500">
                              <span>
                                {new Date(
                                  status.timestamp
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {status.content === "complete" && (
                                <div className="flex items-center text-xs py-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                                  <span className="text-green-700 font-medium">
                                    Web scraping complete
                                  </span>
                                </div>
                              )}
                              {includeScreenshot &&
                                status.screenshot === "complete" && (
                                  <div className="flex items-center text-xs py-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                                    <span className="text-green-700 font-medium">
                                      Screenshot complete
                                    </span>
                                  </div>
                                )}
                              {status.ai === "complete" && (
                                <div className="flex items-center text-xs py-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                                  <span className="text-green-700 font-medium">
                                    AI generation complete
                                  </span>
                                </div>
                              )}
                              {status.content === "loading" &&
                                renderStatusIndicator(
                                  status.content,
                                  "Web scraping"
                                )}
                              {includeScreenshot &&
                                status.screenshot === "loading" &&
                                renderStatusIndicator(
                                  status.screenshot,
                                  "Screenshot"
                                )}
                              {status.ai === "loading" &&
                                renderStatusIndicator(
                                  status.ai,
                                  "AI Generation"
                                )}
                              {status.content === "error" &&
                                renderStatusIndicator(
                                  status.content,
                                  "Web scraping failed"
                                )}
                              {includeScreenshot &&
                                status.screenshot === "error" &&
                                renderStatusIndicator(
                                  status.screenshot,
                                  "Screenshot failed"
                                )}
                              {status.ai === "error" &&
                                renderStatusIndicator(
                                  status.ai,
                                  "AI generation failed"
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-500">
                    Web Scraping
                  </div>
                  {renderStatusIndicator(contentStatus, "Content scraping")}
                </div>
                {includeScreenshot && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500">
                      Screenshot
                    </div>
                    {renderStatusIndicator(
                      screenshotStatus,
                      "Screenshot capture"
                    )}
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-500">
                  AI Generation
                </div>
                {renderStatusIndicator(aiStatus, "Component generation")}
              </div>
            </div>
          )}

          {timeElapsed !== null && (
            <div className="flex flex-col text-sm text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
              <div className="flex items-center font-medium">
                <Clock className="h-4 w-4 mr-1.5" />
                Total time: {timeElapsed.toFixed(2)}s
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {scrapeDuration && (
                  <div className="text-xs ml-5">
                    <span className="font-medium">Web scraping:</span>{" "}
                    {scrapeDuration.toFixed(2)}s
                  </div>
                )}
                {aiDuration && (
                  <div className="text-xs ml-5">
                    <span className="font-medium">AI generation:</span>{" "}
                    {aiDuration.toFixed(2)}s
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col h-[calc(100vh-8.5rem)] overflow-hidden">
        <Tabs
          defaultValue="editor"
          value={activeTab}
          onValueChange={setActiveTab}
          className="md:hidden flex-1 flex flex-col h-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-2 absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-36 bg-slate-800/80 text-white">
            <TabsTrigger
              value="editor"
              className="data-[state=active]:bg-slate-700"
            >
              Code
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:bg-slate-700"
            >
              Result
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="editor"
            className="flex-1 data-[state=active]:flex flex-col h-full overflow-hidden"
          >
            <Editor code={code} onChange={handleCodeChange} />
          </TabsContent>
          <TabsContent
            value="preview"
            className="flex-1 data-[state=active]:flex flex-col h-full overflow-hidden"
          >
            <Preview code={code} />
          </TabsContent>
        </Tabs>

        <div className="hidden md:grid md:grid-cols-2 h-full relative overflow-hidden">
          <div className="h-full col-span-1 overflow-hidden">
            <Editor code={code} onChange={handleCodeChange} />
          </div>
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200"></div>
          <div className="h-full col-span-1 overflow-hidden">
            <Preview code={code} />
          </div>
        </div>
      </div>
    </main>
  );
}
