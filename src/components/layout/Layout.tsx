import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
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
