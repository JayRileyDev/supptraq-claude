import { IconDashboard, IconSettings, IconMessageCircle, IconUpload, IconCurrencyDollar, IconShoppingCart } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { Zap, ChevronLeft, ChevronRight, BarChart3, HardDrive, Settings, MessageSquare } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    description: "Overview & insights"
  },
  {
    title: "Sales",
    url: "/sales", 
    icon: IconShoppingCart,
    description: "Revenue & performance"
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: HardDrive,
    description: "Stock & transfers"
  },
  {
    title: "Upload Data",
    url: "/upload",
    icon: IconUpload,
    description: "Import CSV files"
  },
  {
    title: "AI Chat",
    url: "/chat",
    icon: MessageSquare,
    description: "Ask questions"
  },
  {
    title: "Budget",
    url: "/budget",
    icon: IconCurrencyDollar,
    description: "Vendor spend tracking"
  }
];

const secondaryItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Account & preferences"
  }
];

interface EnhancedSidebarProps {
  user?: any;
}

export function EnhancedSidebar({ user }: EnhancedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Filter navigation items based on user permissions
  const allowedNavigationItems = navigationItems.filter(item => {
    // Owners have access to all pages
    if (currentUser?.role === "owner") return true;
    
    // Members only have access to pages in their allowedPages array
    if (currentUser?.role === "member") {
      return currentUser.allowedPages?.includes(item.url) || false;
    }
    
    // Default: no access if role is undefined
    return false;
  });

  const allowedSecondaryItems = secondaryItems.filter(item => {
    // Settings is available to all authenticated users
    if (item.url === "/settings") return true;
    
    // Apply same logic as navigation items for other secondary items
    if (currentUser?.role === "owner") return true;
    if (currentUser?.role === "member") {
      return currentUser.allowedPages?.includes(item.url) || false;
    }
    
    return false;
  });

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === url;
    }
    return location.pathname.startsWith(url);
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-card border-r border-border flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <img src="/supptraq-logo-white-cropped.svg" alt="Supptraq" className="h-8 w-auto" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>


      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {allowedNavigationItems.map((item, index) => (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                "hover:bg-muted/50 hover:scale-[1.02] transform",
                "glow-card",
                isActive(item.url)
                  ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/20 shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-200",
                  isActive(item.url)
                    ? "text-primary drop-shadow-sm"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground/70">
                        {item.description}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>
      </div>


      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Secondary Nav */}
        {allowedSecondaryItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "hover:bg-muted/50 hover:scale-[1.02] transform",
              isActive(item.url)
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}

        {/* Theme Toggle & User Info */}
        <div className="flex items-center justify-between pt-2">
          <ThemeToggle />
          
          <AnimatePresence>
            {!isCollapsed && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Link
                  to="/settings"
                  className="flex items-center gap-2 hover:bg-muted/50 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02] transform"
                >
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center shadow-lg">
                    <span className="text-sm font-medium text-white">
                      {user.firstName?.[0] || user.name?.[0] || "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.firstName || "User"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}