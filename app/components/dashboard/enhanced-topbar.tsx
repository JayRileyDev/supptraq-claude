import { Bell, Search, HelpCircle, Settings, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useLocation, Link } from "react-router";
import { useUser, useClerk } from "@clerk/react-router";
import { motion } from "framer-motion";

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/sales": "Sales Analytics",
  "/dashboard/inventory": "Inventory Management", 
  "/dashboard/chat": "AI Assistant",
  "/dashboard/reports": "Reports",
  "/dashboard/budget": "Budget Tracking",
  "/dashboard/settings": "Settings",
  "/upload": "Upload Data"
};

interface EnhancedTopbarProps {
  className?: string;
}

export function EnhancedTopbar({ className }: EnhancedTopbarProps) {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const currentPageName = pageNames[location.pathname] || "Dashboard";
  
  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };


  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card border-b border-border backdrop-blur-sm", className)}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section - Greeting */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {getCurrentTime()}, {user?.firstName || "User"}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <Badge variant="secondary" className="text-xs">
                {currentPageName}
              </Badge>
            </div>
          </div>
        </div>


        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Log Out Button */}
          <Button 
            onClick={() => signOut({ redirectUrl: "/" })}
            size="sm" 
            variant="destructive"
            className="hover:scale-105 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>

          {/* Notifications */}
          <Button 
            asChild
            variant="ghost" 
            size="icon" 
            className="relative text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Link>
          </Button>

          {/* Settings */}
          <Button 
            asChild
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <Link to="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                {user?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}