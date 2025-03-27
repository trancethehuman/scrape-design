import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ScraperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white shadow-sm h-14 z-10">
        <div className="w-full h-full px-4 flex items-center">
          <Link href="/">
            <h1 className="text-xl font-bold text-slate-800">
              Component Preview
            </h1>
          </Link>
          <div className="ml-4">
            <span className="text-slate-500 font-medium">/ Web Scraper</span>
          </div>
          <div className="ml-auto">
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Editor
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
