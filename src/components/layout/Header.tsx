import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, TrendingUp, PenSquare, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/articles";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isPublisher, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isPublisher && (
                    <DropdownMenuItem asChild>
                      <Link to="/publisher" className="flex items-center gap-2">
                        <PenSquare className="h-4 w-4" />
                        Publisher Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isPublisher || isAdmin) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
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
          <form onSubmit={handleSearch} className="border-t border-border py-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, topics, authors..."
                className="w-full bg-muted rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </form>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4">
            <nav className="flex flex-col gap-2">
              {isPublisher && (
                <Link
                  to="/publisher"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-muted transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PenSquare className="h-4 w-4" />
                  Publisher Portal
                </Link>
              )}
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
              {user && (
                <>
                  <div className="border-t border-border my-2" />
                  <button 
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="px-3 py-2 text-sm text-destructive text-left"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
