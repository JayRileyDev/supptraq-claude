// Route prefetching utility for store ops navigation
export const STORE_OPS_ROUTES = [
  "/store-ops",
  "/store-ops/operational", 
  "/store-ops/averages",
  "/store-ops/daily-checklist",
  "/store-ops/sl-checklist",
  "/store-ops/dl-checklist",
  "/store-ops/returns",
  "/store-ops/callbacks", 
  "/store-ops/close-dated",
  "/store-ops/tablet-counts",
  "/store-ops/cleaning",
  "/store-ops/budget",
  "/store-ops/notifications",
  "/store-ops/settings"
] as const;

export type StoreOpsRoute = typeof STORE_OPS_ROUTES[number];

// Prefetch critical routes on page load
export function prefetchCriticalRoutes() {
  if (typeof window === 'undefined') return;
  
  const criticalRoutes = [
    "/store-ops",
    "/store-ops/daily-checklist", 
    "/store-ops/callbacks",
    "/store-ops/returns"
  ];

  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    });
  }
}

// Enhanced navigation function with better UX
export function navigateWithOptimization(navigate: (path: string) => void, path: string, currentPath: string) {
  // Prevent navigation to same route
  if (currentPath === path) return;
  
  // Add visual feedback class to body for global loading state
  document.body.classList.add('navigating');
  
  // Navigate
  navigate(path);
  
  // Remove loading state after navigation
  setTimeout(() => {
    document.body.classList.remove('navigating');
  }, 300);
}