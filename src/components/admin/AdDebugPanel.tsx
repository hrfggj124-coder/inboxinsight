import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ExternalLink, Bug, Zap } from "lucide-react";
import { toast } from "sonner";

interface SnippetTestResult {
  location: string;
  success: boolean;
  html: string;
  scripts: string[];
  inlineScripts: string[];
  error?: string;
  responseTime: number;
}

interface AdLoadStatus {
  location: string;
  loaded: boolean;
  error?: string;
  scriptUrl?: string;
}

const AD_LOCATIONS = [
  "header",
  "body-start",
  "body-end",
  "sidebar",
  "in-content",
  "article_top",
  "article_bottom",
  "footer",
];

export const AdDebugPanel = () => {
  const [testResults, setTestResults] = useState<SnippetTestResult[]>([]);
  const [adLoadStatuses, setAdLoadStatuses] = useState<AdLoadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [networkErrors, setNetworkErrors] = useState<string[]>([]);

  // Capture console errors related to ads
  useEffect(() => {
    const originalError = console.error;
    const errors: string[] = [];
    
    console.error = (...args) => {
      const message = args.map(a => String(a)).join(" ");
      if (message.includes("ad") || message.includes("script") || message.includes("CSP") || message.includes("403") || message.includes("blocked")) {
        errors.push(message);
        setConsoleErrors(prev => [...prev, message].slice(-20));
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Test all snippet locations
  const testAllSnippets = useCallback(async () => {
    setIsLoading(true);
    setTestResults([]);
    setNetworkErrors([]);

    const results: SnippetTestResult[] = [];

    for (const location of AD_LOCATIONS) {
      const startTime = performance.now();
      try {
        const { data, error } = await supabase.functions.invoke('get-html-snippets', {
          body: { location }
        });

        const responseTime = Math.round(performance.now() - startTime);

        if (error) {
          results.push({
            location,
            success: false,
            html: "",
            scripts: [],
            inlineScripts: [],
            error: error.message,
            responseTime,
          });
        } else {
          results.push({
            location,
            success: true,
            html: data.html || "",
            scripts: data.scripts || [],
            inlineScripts: data.inlineScripts || [],
            responseTime,
          });
        }
      } catch (err: any) {
        results.push({
          location,
          success: false,
          html: "",
          scripts: [],
          inlineScripts: [],
          error: err.message,
          responseTime: Math.round(performance.now() - startTime),
        });
      }
    }

    setTestResults(results);
    setIsLoading(false);
    
    const successCount = results.filter(r => r.success).length;
    const withContent = results.filter(r => r.html || r.scripts.length > 0).length;
    
    toast.success(`Tested ${results.length} locations: ${successCount} OK, ${withContent} with content`);
  }, []);

  // Test script loading
  const testScriptLoading = useCallback(async () => {
    setAdLoadStatuses([]);
    const statuses: AdLoadStatus[] = [];

    for (const result of testResults) {
      for (const scriptUrl of result.scripts) {
        try {
          const response = await fetch(scriptUrl, { method: 'HEAD', mode: 'no-cors' });
          statuses.push({
            location: result.location,
            loaded: true,
            scriptUrl,
          });
        } catch (err: any) {
          statuses.push({
            location: result.location,
            loaded: false,
            error: err.message,
            scriptUrl,
          });
          setNetworkErrors(prev => [...prev, `${scriptUrl}: ${err.message}`].slice(-10));
        }
      }
    }

    setAdLoadStatuses(statuses);
    
    const loadedCount = statuses.filter(s => s.loaded).length;
    toast.info(`Script test: ${loadedCount}/${statuses.length} accessible`);
  }, [testResults]);

  // Check CSP headers
  const checkCSPHeaders = () => {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      const content = cspMeta.getAttribute('content') || '';
      toast.info("CSP policy found in meta tag");
      return content;
    }
    toast.warning("No CSP meta tag found");
    return null;
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const totalScripts = testResults.reduce((acc, r) => acc + r.scripts.length, 0);
  const totalWithContent = testResults.filter(r => r.html || r.scripts.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ad Debug Panel</h2>
          <p className="text-sm text-muted-foreground">
            Test snippet loading, CSP compliance, and network requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testAllSnippets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Test All Snippets
          </Button>
          <Button variant="outline" onClick={testScriptLoading} disabled={testResults.length === 0}>
            <Zap className="h-4 w-4 mr-2" />
            Test Scripts
          </Button>
          <Button variant="outline" onClick={checkCSPHeaders}>
            <Bug className="h-4 w-4 mr-2" />
            Check CSP
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{testResults.length}</div>
              <div className="text-sm text-muted-foreground">Locations Tested</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{totalWithContent}</div>
              <div className="text-sm text-muted-foreground">With Content</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-accent-foreground">{totalScripts}</div>
              <div className="text-sm text-muted-foreground">External Scripts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{networkErrors.length}</div>
              <div className="text-sm text-muted-foreground">Network Errors</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Snippet Test Results</CardTitle>
            <CardDescription>Results from edge function calls for each location</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div key={result.location} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <span className="font-mono font-medium">{result.location}</span>
                        <Badge variant={result.html || result.scripts.length > 0 ? "default" : "secondary"}>
                          {result.html || result.scripts.length > 0 ? "Has Content" : "Empty"}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{result.responseTime}ms</span>
                    </div>
                    
                    {result.error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">
                        {result.error}
                      </div>
                    )}
                    
                    {result.scripts.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">External Scripts:</div>
                        {result.scripts.map((script, i) => (
                          <div key={i} className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {script}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.inlineScripts && result.inlineScripts.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Inline Scripts: {result.inlineScripts.length}</div>
                      </div>
                    )}
                    
                    {result.html && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">HTML Preview:</div>
                        <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto max-h-20">
                          {result.html.substring(0, 200)}
                          {result.html.length > 200 && "..."}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Script Load Status */}
      {adLoadStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Script Load Status</CardTitle>
            <CardDescription>Network accessibility of ad scripts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adLoadStatuses.map((status, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {status.loaded ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-mono text-xs truncate flex-1">{status.scriptUrl}</span>
                  {status.error && (
                    <Badge variant="destructive" className="text-xs">{status.error}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Console & Network Errors */}
      {(consoleErrors.length > 0 || networkErrors.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Captured Errors</CardTitle>
            <CardDescription>Console and network errors related to ads</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {consoleErrors.map((error, i) => (
                <div key={`console-${i}`} className="text-xs font-mono text-destructive mb-1">
                  [Console] {error}
                </div>
              ))}
              {networkErrors.map((error, i) => (
                <div key={`network-${i}`} className="text-xs font-mono text-amber-600 mb-1">
                  [Network] {error}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>403 Errors:</strong> Ad network is blocking the domain. Add your published domain to the ad network's allowed sites list.</p>
          <p><strong>CSP Errors:</strong> Script domain not in Content-Security-Policy. Update index.html CSP meta tag.</p>
          <p><strong>Empty Results:</strong> No snippets configured for this location. Add snippets in HTML tab.</p>
          <p><strong>Slow Response:</strong> Edge function cold start. Subsequent requests should be faster.</p>
        </CardContent>
      </Card>
    </div>
  );
};
