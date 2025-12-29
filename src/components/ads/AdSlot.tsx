interface AdSlotProps {
  type: "banner" | "sidebar" | "inline" | "footer";
  className?: string;
}

export const AdSlot = ({ type, className = "" }: AdSlotProps) => {
  const sizes: Record<string, string> = {
    banner: "h-[90px] md:h-[100px]",
    sidebar: "h-[250px] md:h-[300px]",
    inline: "h-[100px] md:h-[120px]",
    footer: "h-[90px]",
  };

  return (
    <div className={`ad-slot ${sizes[type]} w-full ${className}`}>
      <span className="text-xs uppercase tracking-wider">Advertisement</span>
    </div>
  );
};
