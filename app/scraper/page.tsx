import { ScraperForm } from "@/components/scraper-form";

export default function ScraperPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Web Scraper</h1>
        <ScraperForm />
      </div>
    </main>
  );
}
