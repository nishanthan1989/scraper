import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  changeValue?: string | number;
  changeDirection?: "up" | "down" | "none";
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  icon,
  title,
  value,
  changeValue,
  changeDirection = "none",
  iconColor = "text-primary-600",
  iconBgColor = "bg-primary-100",
}: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <div className={cn("h-6 w-6", iconColor)}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              
              {changeValue && changeDirection !== "none" && (
                <div className={cn(
                  "ml-2 flex items-baseline text-sm font-semibold",
                  {
                    "text-green-600": changeDirection === "up",
                    "text-red-600": changeDirection === "down",
                    "text-yellow-600": changeDirection === "none"
                  }
                )}>
                  {changeDirection === "up" && (
                    <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {changeDirection === "down" && (
                    <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="sr-only">
                    {changeDirection === "up" ? "Increased by" : changeDirection === "down" ? "Decreased by" : "No change"}
                  </span>
                  {changeValue}
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}
