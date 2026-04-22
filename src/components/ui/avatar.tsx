import * as React from "react";
import { cn } from "@/lib/utils";

const AvatarContext = React.createContext<{ imageLoaded: boolean; setImageLoaded: (v: boolean) => void } | null>(null);

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
      <div
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border", className)}
        {...props}
      />
    </AvatarContext.Provider>
  );
}

export function AvatarImage({ className, src, alt = "avatar", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const context = React.useContext(AvatarContext);
  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className, !src && "hidden")}
      onLoad={() => context?.setImageLoaded(true)}
      onError={() => context?.setImageLoaded(false)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  const context = React.useContext(AvatarContext);
  return (
    <span
      className={cn(
        "absolute inset-0 grid place-items-center rounded-full bg-muted text-sm font-semibold",
        context?.imageLoaded && "hidden",
        className
      )}
      {...props}
    />
  );
}
