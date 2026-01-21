import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";

interface InContentAdProps {
  className?: string;
}

export const InContentAd = ({ className = "" }: InContentAdProps) => {
  return (
    <div className={`my-8 ${className}`}>
      <HTMLSnippetRenderer location="in-content" className="w-full" />
    </div>
  );
};
