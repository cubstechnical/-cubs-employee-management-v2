import React from "react";
import { cn } from "@/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  color?: "success" | "error" | "warning" | "info" | "primary";
  className?: string;
}

export default function Badge({ children, color = "primary", className }: BadgeProps) {
  const colorClasses = {
    success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    primary: "bg-[#d3194f]/10 text-[#d3194f] dark:bg-[#d3194f]/20 dark:text-[#d3194f]"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
}
