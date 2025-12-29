import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/articles";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container flex h-10 items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Trending:</span>
            <Link to="/article/openai-unveils-gpt-5-multimodal-ai" className="hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-none">
              OpenAI Unveils GPT-5
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Contact</Link>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">T</span>
              </div>
              <span className="hidden font-display text-xl font-bold sm:inline-block">
                Tech<span className="text-primary">Pulse</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {category.name}
                </Link>
              ))}
              <Link
                to="/categories"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                More
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Button variant="default" size="sm" className="hidden sm:inline-flex">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="border-t border-border py-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles, topics, authors..."
                className="w-full bg-muted rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4">
            <nav className="flex flex-col gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className={`w-2 h-2 rounded-full bg-category-${category.color}`} />
                  {category.name}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              <Link to="/about" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link to="/contact" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
