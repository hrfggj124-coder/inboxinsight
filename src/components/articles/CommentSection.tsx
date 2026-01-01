import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Send, Trash2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface CommentSectionProps {
  articleId: string;
}

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    author: { display_name: string | null; avatar_url: string | null } | null;
    replies?: CommentItemProps["comment"][];
  };
  articleId: string;
  onReply: (parentId: string) => void;
  depth?: number;
}

const CommentItem = ({ comment, articleId, onReply, depth = 0 }: CommentItemProps) => {
  const { user } = useAuth();
  const deleteComment = useDeleteComment();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteComment.mutate(
      { id: comment.id, articleId },
      {
        onSuccess: () => {
          toast({ title: "Comment deleted" });
        },
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

  const displayName = comment.author?.display_name || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-8 mt-4" : ""}`}>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={comment.author?.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {user && depth === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-3 w-3" />
              Reply
            </Button>
          )}
          {user?.id === comment.user_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteComment.isPending}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          )}
        </div>
        {comment.replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            articleId={articleId}
            onReply={onReply}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

export const CommentSection = ({ articleId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(articleId);
  const createComment = useCreateComment();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    createComment.mutate(
      {
        articleId,
        content: content.trim(),
        parentId: replyingTo || undefined,
      },
      {
        onSuccess: () => {
          setContent("");
          setReplyingTo(null);
          toast({ title: "Comment posted!" });
        },
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

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setContent("");
  };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <span>Replying to a comment</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={cancelReply}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.email?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px] resize-none"
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {content.length}/1000
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || createComment.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {createComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-muted-foreground mb-2">Sign in to join the conversation</p>
          <Button asChild size="sm">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
