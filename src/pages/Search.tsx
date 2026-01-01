import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearch } from "@/hooks/useSearch";
import { useCategories } from "@/hooks/useArticles";
import { Search as SearchIcon, Filter, X, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string>("");
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "popular">("relevance");

  const { data: categories = [] } = useCategories();
  const { data: results = [], isLoading, isFetching } = useSearch({
    query,
    categoryId: categoryId || undefined,
    sortBy,
  });

  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      setInputValue(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
    setSearchParams({ q: inputValue });
  };

  const clearFilters = () => {
    setCategoryId("");
    setSortBy("relevance");
  };

  const hasFilters = categoryId || sortBy !== "relevance";

  return (
    <Layout>
      <SEOHead
        title={query ? `Search: ${query}` : "Search Articles"}
        description="Search through our collection of tech news and articles"
        canonical="/search"
      />

      <div className="container py-8">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="font-display text-3xl font-bold mb-6 text-center">
            Search Articles
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for articles, topics, or keywords..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-12 pr-24 h-14 text-lg"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={!inputValue.trim()}
            >
              Search
            </Button>
          </form>
        </div>

        {/* Filters */}
        {query && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {!isLoading && results.length > 0 && (
                <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {!query ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg text-muted-foreground">
              Enter a search term to find articles
            </p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 p-4 border border-border rounded-lg animate-pulse">
                <Skeleton className="h-24 w-32 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">
              No articles found for "{query}"
            </p>
            <p className="text-sm text-muted-foreground">
              Try different keywords or remove some filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.slug}`}
                className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors group"
              >
                <div className="h-24 w-32 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {article.category && (
                      <Badge variant="secondary" className="text-xs">
                        {article.category.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.read_time || 5} min
                    </span>
                    {article.views_count && article.views_count > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{article.author?.display_name || "Staff Writer"}</span>
                    <span>•</span>
                    <span>
                      {article.published_at
                        ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
                        : "Recently"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
