import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLikes, useUserLike, useToggleLike } from "@/hooks/useLikes";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  articleId: string;
}

export const LikeButton = ({ articleId }: LikeButtonProps) => {
  const { user } = useAuth();
  const { data: likesCount = 0 } = useLikes(articleId);
  const { data: isLiked = false } = useUserLike(articleId, user?.id);
  const toggleLike = useToggleLike();
  const { toast } = useToast();

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like articles.",
        variant: "destructive",
      });
      return;
    }

    toggleLike.mutate(
      { articleId, isLiked },
      {
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "gap-2 transition-colors",
        isLiked && "text-red-500 hover:text-red-600"
      )}
      onClick={handleLike}
      disabled={toggleLike.isPending}
    >
      <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
      {likesCount > 0 && <span>{likesCount}</span>}
      {likesCount === 0 && <span>Like</span>}
    </Button>
  );
};
