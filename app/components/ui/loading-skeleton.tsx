import { cn } from "~/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: "card" | "text" | "circle" | "rectangle";
}

export function LoadingSkeleton({ 
  className, 
  lines = 1, 
  variant = "rectangle" 
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-muted rounded";
  
  const variantClasses = {
    card: "h-32 w-full",
    text: "h-4 w-full",
    circle: "h-12 w-12 rounded-full",
    rectangle: "h-4 w-full"
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses.text,
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header Skeleton */}
      <div className="text-center space-y-2">
        <LoadingSkeleton className="h-8 w-64 mx-auto" />
        <LoadingSkeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glow-card card-shadow border border-border/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton variant="circle" className="h-8 w-8" />
            </div>
            <LoadingSkeleton className="h-8 w-16 mb-2" />
            <LoadingSkeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <div className="glow-card card-shadow border border-border/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <LoadingSkeleton className="h-6 w-32 mb-2" />
                <LoadingSkeleton className="h-4 w-48" />
              </div>
              <LoadingSkeleton className="h-6 w-16" />
            </div>
            <LoadingSkeleton className="h-48 w-full" />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="glow-card card-shadow border border-border/50 rounded-lg p-6">
            <div className="mb-6">
              <LoadingSkeleton className="h-6 w-32 mb-2" />
              <LoadingSkeleton className="h-4 w-48" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <LoadingSkeleton variant="circle" className="h-8 w-8" />
                  <div className="flex-1">
                    <LoadingSkeleton className="h-4 w-24 mb-1" />
                    <LoadingSkeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}