"use client";

import { useState } from "react";
import Image from "next/image";
import { scrapeWebsite } from "@/lib/actions/scraper";
import { testScraperSdk } from "@/lib/actions/test-scraper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function ScraperForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [scrapeDuration, setScrapeDuration] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    data?: any;
    screenshot?: string;
    error?: string;
    timing?: {
      serverProcessingTime: number;
    };
  } | null>(null);

  // Options state
  const [options, setOptions] = useState({
    screenshot: false,
    renderJs: true,
    premium: false,
    ultraPremium: false,
    device: "desktop" as "desktop" | "mobile" | "tablet",
    autoScroll: false,
  });

  // Toggle option helper
  const toggleOption = (option: keyof typeof options, value: any) => {
    // If enabling ultra_premium, disable premium (they should not be used together)
    if (option === "ultraPremium" && value === true) {
      setOptions({
        ...options,
        ultraPremium: true,
        premium: false,
      });
    }
    // If enabling premium, disable ultra_premium (they should not be used together)
    else if (option === "premium" && value === true) {
      setOptions({
        ...options,
        premium: true,
        ultraPremium: false,
      });
    } else {
      setOptions({
        ...options,
        [option]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setScrapeDuration(null);

    // Ensure URL starts with http:// or https://
    let processedUrl = url;
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = "https://" + processedUrl;
    }

    const startTime = performance.now();

    try {
      const response = await scrapeWebsite({
        url: processedUrl,
        ...options,
      });

      const endTime = performance.now();
      setScrapeDuration(endTime - startTime);
      console.log("Scraper response:", response);
      setResult(response);
    } catch (error) {
      const endTime = performance.now();
      setScrapeDuration(endTime - startTime);
      console.error("Error calling scraper:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSdk = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await testScraperSdk();
      setTestResult(response);
    } catch (error) {
      console.error("Error testing SDK:", error);
      setTestResult({
        success: false,
        message: "Test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Format duration in seconds with 2 decimal places
  const formatDuration = (ms: number): string => {
    return (ms / 1000).toFixed(2);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Website Scraper</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Powered by ScraperAPI SDK
          </span>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSdk}
            disabled={isTesting}
            className="text-xs"
          >
            {isTesting ? "Testing..." : "Test SDK Connection"}
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-3 text-sm rounded-md ${
              testResult.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <p>{testResult.message}</p>
            </div>
            {testResult.data && (
              <pre className="mt-2 text-xs overflow-auto p-2 bg-slate-50 rounded">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            )}
            {testResult.error && (
              <p className="mt-1 text-xs">{testResult.error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">URL to Scrape</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Options</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="screenshot"
                  checked={options.screenshot}
                  onCheckedChange={(checked) =>
                    toggleOption("screenshot", !!checked)
                  }
                />
                <Label htmlFor="screenshot">Take Screenshot</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="renderJs"
                  checked={options.renderJs}
                  onCheckedChange={(checked) =>
                    toggleOption("renderJs", !!checked)
                  }
                />
                <Label htmlFor="renderJs">Render JavaScript</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoScroll"
                  checked={options.autoScroll}
                  onCheckedChange={(checked) =>
                    toggleOption("autoScroll", !!checked)
                  }
                />
                <Label htmlFor="autoScroll">Auto Scroll</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="premium"
                  checked={options.premium}
                  onCheckedChange={(checked) =>
                    toggleOption("premium", !!checked)
                  }
                />
                <Label htmlFor="premium">Use Premium Proxy</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ultraPremium"
                  checked={options.ultraPremium}
                  onCheckedChange={(checked) =>
                    toggleOption("ultraPremium", !!checked)
                  }
                />
                <Label htmlFor="ultraPremium">Use Ultra Premium Proxy</Label>
              </div>

              <div className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>
                  For heavily protected websites, enable Premium or Ultra
                  Premium
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device">Device Type</Label>
                <Select
                  value={options.device}
                  onValueChange={(value) =>
                    toggleOption(
                      "device",
                      value as "desktop" | "mobile" | "tablet"
                    )
                  }
                >
                  <SelectTrigger id="device" className="w-full">
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading || !url} className="w-full">
            {isLoading ? "Scraping..." : "Scrape Website"}
          </Button>
        </form>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Results</h3>
            {scrapeDuration !== null && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span>
                  Request time: {formatDuration(scrapeDuration)} seconds
                  {result?.timing && (
                    <>
                      {" "}
                      (server:{" "}
                      {formatDuration(result.timing.serverProcessingTime)} sec)
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {!result.success && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{result.error}</p>
              {result.error?.includes("protected domains") && (
                <p className="mt-2 font-semibold">
                  Try enabling the "Premium" or "Ultra Premium" option and try
                  again.
                </p>
              )}
            </div>
          )}

          {result.success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <p>Request completed successfully</p>
              {scrapeDuration !== null && (
                <span className="ml-auto text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Total: {formatDuration(scrapeDuration)} sec
                  {result.timing && (
                    <span className="text-xs ml-1">
                      (server:{" "}
                      {formatDuration(result.timing.serverProcessingTime)} sec)
                    </span>
                  )}
                </span>
              )}
            </div>
          )}

          {result.success && result.screenshot && (
            <div className="space-y-2">
              <p className="font-medium">Screenshot:</p>
              <div className="border rounded-lg overflow-hidden bg-white">
                {/* Use Next.js Image component with unoptimized for data URLs */}
                <div className="relative w-full" style={{ minHeight: "400px" }}>
                  <Image
                    src={result.screenshot}
                    alt="Screenshot of the website"
                    fill
                    style={{ objectFit: "contain" }}
                    unoptimized
                    priority
                  />
                </div>
                <div className="p-2 text-xs text-center text-slate-500">
                  Screenshot of {url}
                </div>
              </div>
            </div>
          )}

          {result.success && result.data && (
            <div className="space-y-2">
              <p className="font-medium">Response Data:</p>
              <Card className="p-4 max-h-96 overflow-auto">
                {typeof result.data === "string" ? (
                  <pre className="whitespace-pre-wrap text-sm">
                    {result.data}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
