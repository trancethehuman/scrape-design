"use client";

import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { mockData } from "@/lib/mock-data";

// Import all shadcn/ui components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Create a components object to pass to the preview
const ShadcnUI = {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
};

interface PreviewProps {
  code: string;
}

export function Preview({ code }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);
  const lastCodeRef = useRef<string>(code);

  const refreshPreview = () => {
    setKey((prev) => prev + 1);
    renderComponent();
  };

  // Function to render the component
  const renderComponent = async () => {
    if (!previewRef.current || !rootRef.current) return;

    // Reset error state at the beginning of each render attempt
    setError(null);

    try {
      // Wait for Babel to be loaded
      if (!(window as any).Babel) {
        setTimeout(renderComponent, 100);
        return;
      }

      // Prepare the code by wrapping it in a component
      // Make sure to properly scope variables by using a self-executing function
      const wrappedCode = `
        (function() {
          const { ${Object.keys(ShadcnUI).join(", ")} } = ShadcnUI;
          ${code}
          return <Preview />;
        })()
      `;

      // Transform JSX to JS using Babel
      const transformedCode = (window as any).Babel.transform(wrappedCode, {
        presets: ["react"],
      }).code;

      // Create a function from the transformed code
      const ComponentFunction = new Function(
        "React",
        "ShadcnUI",
        "LucideIcons",
        "cn",
        "mockData",
        `return ${transformedCode}`
      );

      // Execute the function to get the component
      const element = ComponentFunction(
        React,
        ShadcnUI,
        LucideIcons,
        cn,
        mockData
      );

      // Render the component
      rootRef.current.render(element);
      lastCodeRef.current = code;
    } catch (err) {
      console.error("Preview error:", err);
      setError(err instanceof Error ? err.message : String(err));

      // Render an error message in the preview area
      if (rootRef.current) {
        rootRef.current.render(
          <div className="p-4 text-red-500">
            <p className="font-bold">Error in preview:</p>
            <pre className="mt-2 text-sm overflow-auto">
              {err instanceof Error ? err.message : String(err)}
            </pre>
            <p className="mt-4 text-sm">
              Fix the error in the editor to update the preview.
            </p>
          </div>
        );
      }
    }
  };

  useEffect(() => {
    // Create a root once
    if (previewRef.current && !rootRef.current) {
      rootRef.current = ReactDOM.createRoot(previewRef.current);
    }

    // If code has changed, attempt to render
    if (code !== lastCodeRef.current) {
      renderComponent();
    }

    // Cleanup function
    return () => {
      // No need to unmount the root, we'll reuse it
    };
  }, [code]);

  return (
    <Card className="h-full border-0 shadow-none overflow-hidden rounded-none flex flex-col">
      <CardContent className="p-0 bg-white flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPreview}
            className="h-7 w-7 p-0 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh preview</span>
          </Button>
        </div>
        <div className="preview-container p-8 h-full w-full shadow-none bg-white overflow-y-auto">
          <div ref={previewRef} className="min-h-[50vh]" />
        </div>
      </CardContent>
    </Card>
  );
}
