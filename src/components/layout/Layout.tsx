import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { useRealtimeHTMLSnippets } from "@/hooks/useRealtimeHTMLSnippets";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  // Enable real-time updates for HTML snippets (Adsterra ads, etc.)
  useRealtimeHTMLSnippets();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global HTML Snippets - Body Start */}
      <AdPlaceholder location="body-start" showFallback={false} />

      {/* Header snippets (e.g. Adsterra Social Bar) inject their scripts globally */}
      <AdPlaceholder location="header" showFallback={false} className="hidden" />

      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      
      {/* Global HTML Snippets - Body End */}
      <AdPlaceholder location="body-end" showFallback={false} />
    </div>
  );
};
