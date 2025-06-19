import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import {
  Store,
  LayoutDashboard,
  FileText,
  TrendingUp,
  CheckSquare,
  Shield,
  Package,
  Phone,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  DollarSign,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/store-ops",
    icon: LayoutDashboard,
    description: "Store overview"
  },
  {
    title: "Operational Info",
    url: "/store-ops/operational",
    icon: FileText,
    description: "Store details"
  },
  {
    title: "Averages",
    url: "/store-ops/averages",
    icon: TrendingUp,
    description: "Rep performance"
  },
  {
    title: "Daily Checklist",
    url: "/store-ops/daily-checklist",
    icon: CheckSquare,
    description: "Daily tasks"
  },
  {
    title: "SL Checklist",
    url: "/store-ops/sl-checklist",
    icon: Shield,
    description: "Store Lead tasks"
  },
  {
    title: "DL Checklist",
    url: "/store-ops/dl-checklist",
    icon: ClipboardList,
    description: "District Lead tasks"
  },
  {
    title: "Returns",
    url: "/store-ops/returns",
    icon: Package,
    description: "Return tracking"
  },
  {
    title: "Callback List",
    url: "/store-ops/callbacks",
    icon: Phone,
    description: "Customer callbacks"
  },
  {
    title: "Close-Dated",
    url: "/store-ops/close-dated",
    icon: AlertTriangle,
    description: "Expiring inventory"
  },
  {
    title: "Tablet Counts",
    url: "/store-ops/tablet-counts",
    icon: Package,
    description: "Tablet inventory"
  },
  {
    title: "Cleaning Sheet",
    url: "/store-ops/cleaning",
    icon: Sparkles,
    description: "Cleaning schedule"
  },
  {
    title: "Ordering Budget",
    url: "/store-ops/budget",
    icon: DollarSign,
    description: "Budget tracking"
  },
  {
    title: "Notifications",
    url: "/store-ops/notifications",
    icon: Bell,
    description: "Alerts & updates"
  },
  {
    title: "Settings",
    url: "/store-ops/settings",
    icon: Settings,
    description: "Store preferences"
  }
];

interface StoreOpsEnhancedSidebarProps {
  user: any;
}

export function StoreOpsEnhancedSidebar({ user }: StoreOpsEnhancedSidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Simple active state calculation
  const activeUrl = useMemo(() => {
    return location.pathname === "/store-ops/" ? "/store-ops" : location.pathname;
  }, [location.pathname]);

  return (
    <motion.div
      initial={{ width: isCollapsed ? 70 : 280 }}
      animate={{ width: isCollapsed ? 70 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-card border-r border-border flex flex-col h-full relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Store Operations</h2>
                <p className="text-xs text-muted-foreground">Operations Portal</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = activeUrl === item.url;
          
          return (
            <div key={item.url}>
              <Link
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative hover:scale-[1.02]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <div className={cn(
                  "transition-transform duration-200",
                  isActive ? "scale-110" : ""
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors", 
                    isActive ? "text-primary-foreground" : ""
                  )} />
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className={cn(
                      "text-xs truncate transition-colors",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 border">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Profile & Theme Toggle */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && currentUser && (
              <motion.div
                key="user-expanded"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="font-medium text-foreground truncate">
                  {currentUser.name || user?.firstName || "Store User"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentUser.email || user?.primaryEmailAddress?.emailAddress}
                </div>
                <div className="text-xs text-primary font-medium">Store Operations</div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <ThemeToggle />
        </div>
      </div>
    </motion.div>
  );
}