import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";
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
      <HTMLSnippetRenderer location="body_start" />
      
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      
      {/* Global HTML Snippets - Body End */}
      <HTMLSnippetRenderer location="body_end" />
    </div>
  );
};
