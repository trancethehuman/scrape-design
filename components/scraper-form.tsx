"use client";

import { useState } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ScraperForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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

    // Ensure URL starts with http:// or https://
    let processedUrl = url;
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = "https://" + processedUrl;
    }

    try {
      const response = await scrapeWebsite({
        url: processedUrl,
        ...options,
      });

      setResult(response);
    } catch (error) {
      console.error("Error calling scraper:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsLoading(false);
    setResult({
      success: false,
      error: "Scraping cancelled by user",
    });
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
            {isTesting ? (
              <>
                <AlertCircle className="h-3 w-3 mr-1 animate-pulse" />
                Testing...
              </>
            ) : (
              "Test SDK Connection"
            )}
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-3 text-sm rounded-md border ${
              testResult.success
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <p className="font-medium">{testResult.message}</p>
            </div>
            {testResult.data && (
              <pre className="mt-2 text-xs overflow-auto p-2 bg-slate-50 rounded border border-slate-200">
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
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="flex-1"
              />
              {isLoading ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button disabled className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
                    Scraping...
                  </Button>
                </div>
              ) : (
                <Button type="submit" disabled={!url}>
                  Scrape Website
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-md border border-slate-200">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-800">Options</h3>

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

              <div className="mt-2 text-sm text-amber-600 flex items-center gap-1 p-2 bg-amber-50 rounded border border-amber-100">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
        </form>
      </div>

      {result && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center">
            <h3 className="text-xl font-semibold">Results</h3>
            {result.success && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Success
              </span>
            )}
          </div>

          {!result.success && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              <p className="font-medium">Error:</p>
              <p>{result.error}</p>
              {result.error?.includes("protected domains") && (
                <p className="mt-2 font-semibold p-2 bg-amber-50 border border-amber-200 rounded">
                  Try enabling the "Premium" or "Ultra Premium" option and try
                  again.
                </p>
              )}
            </div>
          )}

          {result.success && result.screenshot && (
            <div className="space-y-2">
              <p className="font-medium text-slate-700">Screenshot:</p>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <img
                  src={result.screenshot}
                  alt="Screenshot of the website"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {result.success && result.data && (
            <div className="space-y-2">
              <p className="font-medium text-slate-700">Response Data:</p>
              <Card className="p-4 max-h-96 overflow-auto shadow-sm">
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
