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
      <AdPlaceholder location="body_start" showFallback={false} />
      
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      
      {/* Global HTML Snippets - Body End */}
      <AdPlaceholder location="body_end" showFallback={false} />
    </div>
  );
};
