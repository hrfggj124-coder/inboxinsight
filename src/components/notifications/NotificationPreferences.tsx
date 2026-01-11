import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/useNotificationSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle, XCircle, MessageSquare, ThumbsUp } from "lucide-react";

interface PreferenceItemProps {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const PreferenceItem = ({
  id,
  label,
  description,
  icon,
  checked,
  onCheckedChange,
  disabled,
}: PreferenceItemProps) => (
  <div className="flex items-start justify-between space-x-4 py-4 border-b last:border-b-0">
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-muted p-2 mt-0.5">
        {icon}
      </div>
      <div className="space-y-1">
        <Label htmlFor={id} className="text-base font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  </div>
);

const PreferencesSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-start justify-between py-4 border-b last:border-b-0">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>
    ))}
  </div>
);

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const { data: settings, isLoading } = useNotificationSettings(user?.id);
  const updateSettings = useUpdateNotificationSettings();
  
  // Local state for optimistic updates
  const [localSettings, setLocalSettings] = useState({
    email_on_approval: true,
    email_on_rejection: true,
    email_on_comment: true,
    email_on_like: false,
  });

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        email_on_approval: settings.email_on_approval ?? true,
        email_on_rejection: settings.email_on_rejection ?? true,
        email_on_comment: settings.email_on_comment ?? true,
        email_on_like: settings.email_on_like ?? false,
      });
    }
  }, [settings]);

  const handleToggle = (key: keyof typeof localSettings, value: boolean) => {
    if (!user) return;
    
    // Optimistic update
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    
    // Persist to database
    updateSettings.mutate({
      userId: user.id,
      settings: { [key]: value },
    });
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Choose which email notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <PreferencesSkeleton />
        ) : (
          <div>
            <PreferenceItem
              id="email_on_approval"
              label="Article Approved"
              description="Get notified when your article is approved and published"
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              checked={localSettings.email_on_approval}
              onCheckedChange={(checked) => handleToggle("email_on_approval", checked)}
              disabled={updateSettings.isPending}
            />
            <PreferenceItem
              id="email_on_rejection"
              label="Article Rejected"
              description="Get notified when your article is rejected with feedback"
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              checked={localSettings.email_on_rejection}
              onCheckedChange={(checked) => handleToggle("email_on_rejection", checked)}
              disabled={updateSettings.isPending}
            />
            <PreferenceItem
              id="email_on_comment"
              label="New Comments"
              description="Get notified when someone comments on your articles"
              icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
              checked={localSettings.email_on_comment}
              onCheckedChange={(checked) => handleToggle("email_on_comment", checked)}
              disabled={updateSettings.isPending}
            />
            <PreferenceItem
              id="email_on_like"
              label="New Likes"
              description="Get notified when someone likes your articles"
              icon={<ThumbsUp className="h-5 w-5 text-pink-500" />}
              checked={localSettings.email_on_like}
              onCheckedChange={(checked) => handleToggle("email_on_like", checked)}
              disabled={updateSettings.isPending}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
