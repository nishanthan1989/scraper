import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "validated" | "pending" | "failed";
  children?: React.ReactNode;
}

export function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
  const statusColors = {
    validated: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  const statusLabel = {
    validated: "Validated",
    pending: "Pending",
    failed: "Failed",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
        statusColors[status],
        className
      )}
      {...props}
    >
      {children || statusLabel[status]}
    </span>
  );
}
