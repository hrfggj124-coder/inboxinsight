import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle, Clock, Mail, MessageSquare, ThumbsUp, XCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "article_approved":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "article_rejected":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "new_comment":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "new_like":
      return <ThumbsUp className="h-5 w-5 text-pink-500" />;
    default:
      return <Mail className="h-5 w-5 text-muted-foreground" />;
  }
};

const NotificationStatusBadge = ({ status }: { status: string | null }) => {
  switch (status) {
    case "sent":
      return <Badge variant="secondary" className="bg-green-500/10 text-green-500">Sent</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status || "Unknown"}</Badge>;
  }
};

const NotificationCard = ({ notification }: { notification: ReturnType<typeof useNotifications>["data"] extends (infer T)[] ? T : never }) => {
  const createdAt = notification.created_at ? new Date(notification.created_at) : null;
  
  // Sanitize notification body to prevent XSS attacks
  const sanitizedBody = useMemo(() => {
    return DOMPurify.sanitize(notification.body, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
  }, [notification.body]);
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              <NotificationIcon type={notification.notification_type} />
            </div>
            <div>
              <CardTitle className="text-base">{notification.subject}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3" />
                {createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : "Unknown time"}
              </CardDescription>
            </div>
          </div>
          <NotificationStatusBadge status={notification.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="text-sm text-muted-foreground prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        />
        {createdAt && (
          <p className="text-xs text-muted-foreground mt-3">
            {format(createdAt, "PPP 'at' p")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const NotificationsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <NotificationsSkeleton />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <SEOHead
        title="Notifications | TechPulse"
        description="View your notification history"
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/10 p-3">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Your notification history</p>
          </div>
        </div>

        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                When you receive notifications about your articles, comments, or likes, they'll appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
