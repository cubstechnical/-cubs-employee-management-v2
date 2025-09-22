"use client";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface CUBSLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "default" | "white" | "dark";
}

export default function CUBSLogo({ 
  size = "md", 
  showText = true, 
  className,
  variant = "default"
}: CUBSLogoProps) {
  const sizeClasses = {
    sm: {
      container: "h-8 w-8",
      image: "h-6 w-6",
      text: "text-lg",
      spacing: "space-x-2"
    },
    md: {
      container: "h-10 w-10",
      image: "h-8 w-8",
      text: "text-xl",
      spacing: "space-x-3"
    },
    lg: {
      container: "h-12 w-12",
      image: "h-10 w-10",
      text: "text-2xl",
      spacing: "space-x-3"
    },
    xl: {
      container: "h-16 w-16",
      image: "h-14 w-14",
      text: "text-3xl",
      spacing: "space-x-4"
    }
  };

  const variantClasses = {
    default: "text-gray-900 dark:text-white",
    white: "text-white",
    dark: "text-gray-900"
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={cn("flex items-center", currentSize.spacing, className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#d3194f] to-[#b0173a] shadow-lg",
        currentSize.container
      )}>
        <Image
          src="/assets/cubs.webp"
          alt="CUBS Logo"
          width={size === "xl" ? 56 : size === "lg" ? 40 : size === "md" ? 32 : 24}
          height={size === "xl" ? 56 : size === "lg" ? 40 : size === "md" ? 32 : 24}
          className={cn("object-contain", currentSize.image)}
          priority
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold tracking-tight",
            currentSize.text,
            variantClasses[variant]
          )}>
            CUBS
          </span>
          <span className={cn(
            "text-xs font-medium tracking-wide opacity-80",
            variant === "white" ? "text-white/80" : "text-gray-600 dark:text-gray-400"
          )}>
            Technical
          </span>
        </div>
      )}
    </div>
  );
}
