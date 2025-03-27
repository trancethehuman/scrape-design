"use client";

import { useState, useEffect } from "react";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { examples } from "@/lib/examples";

export default function Home() {
  const [code, setCode] = useState(examples.button.code);
  const [activeTab, setActiveTab] = useState("editor");

  const handleCodeChange = (value: string) => {
    setCode(value);
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

  return (
    <main className="flex flex-col bg-slate-50 overflow-hidden h-screen">
      <header className="border-b bg-white shadow-sm shrink-0 h-14 z-10">
        <div className="w-full h-full px-4 flex items-center">
          <h1 className="text-xl font-bold text-slate-800">
            Component Preview
          </h1>
          <div className="ml-auto flex items-center space-x-3">
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

      <div className="w-full flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
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
            className="flex-1 data-[state=active]:flex flex-col h-full"
          >
            <Editor code={code} onChange={handleCodeChange} />
          </TabsContent>
          <TabsContent
            value="preview"
            className="flex-1 data-[state=active]:flex flex-col h-full"
          >
            <Preview code={code} />
          </TabsContent>
        </Tabs>

        <div className="hidden md:grid md:grid-cols-2 h-full relative">
          <div className="h-full col-span-1">
            <Editor code={code} onChange={handleCodeChange} />
          </div>
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200"></div>
          <div className="h-full col-span-1">
            <Preview code={code} />
          </div>
        </div>
      </div>
    </main>
  );
}
