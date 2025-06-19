import { Bell, Search, HelpCircle, Settings, LogOut, Store } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useLocation, Link } from "react-router";
import { useUser, useClerk } from "@clerk/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useState, useEffect } from "react";

const storeOpsPageNames: Record<string, string> = {
  "/store-ops": "Store Operations Dashboard",
  "/store-ops/operational": "Operational Information",
  "/store-ops/averages": "Rep Averages",
  "/store-ops/daily-checklist": "Daily Checklist",
  "/store-ops/sl-checklist": "Store Lead Checklist",
  "/store-ops/dl-checklist": "District Lead Checklist",
  "/store-ops/returns": "Returns Management",
  "/store-ops/callbacks": "Customer Callbacks",
  "/store-ops/close-dated": "Close-Dated Items",
  "/store-ops/tablet-counts": "Tablet Counts",
  "/store-ops/cleaning": "Cleaning Schedule",
  "/store-ops/budget": "Ordering Budget",
  "/store-ops/notifications": "Notifications",
  "/store-ops/settings": "Store Settings"
};

interface StoreOpsEnhancedTopbarProps {
  className?: string;
}

// Animated Greeting Component for Store Ops
function StoreOpsAnimatedGreeting({ user }: { user: any }) {
  const [isVisible, setIsVisible] = useState(false);
  const greeting = getCurrentTime();
  const userName = user?.firstName || "Store User";
  const emoji = getGreetingEmoji();
  const gradientColor = getGreetingColor();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const greetingWords = greeting.split(" ");
  const fullText = `${greeting}, ${userName}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const wordVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.8 
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-2"
    >
      <motion.span
        variants={wordVariants}
        className="text-2xl"
      >
        {emoji}
      </motion.span>
      <motion.div
        variants={wordVariants}
        className={cn(
          "text-lg font-semibold bg-gradient-to-r bg-clip-text text-transparent",
          gradientColor
        )}
      >
        {fullText}
      </motion.div>
      <motion.div
        variants={wordVariants}
      >
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          <Store className="w-3 h-3 mr-1" />
          Store Ops
        </Badge>
      </motion.div>
    </motion.div>
  );
}

// Time-based greeting helpers
function getCurrentTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return "🌅";
  if (hour < 17) return "☀️";
  return "🌙";
}

function getGreetingColor() {
  const hour = new Date().getHours();
  if (hour < 12) return "from-orange-400 to-pink-400";
  if (hour < 17) return "from-blue-400 to-purple-400";
  return "from-purple-400 to-blue-400";
}

export function StoreOpsEnhancedTopbar({ className }: StoreOpsEnhancedTopbarProps) {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

  const currentPageName = storeOpsPageNames[location.pathname] || "Store Operations";

  const handleSignOut = () => {
    setIsSignOutDialogOpen(false);
    signOut(() => {
      window.location.href = "/";
    });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Page Info & Greeting */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{currentPageName}</h1>
            </div>
            <StoreOpsAnimatedGreeting user={user} />
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search store operations..."
              className="pl-10 bg-muted/50 border-muted-foreground/20 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="relative hover:bg-muted"
          >
            <Link to="/store-ops/notifications">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                2
              </Badge>
            </Link>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm" className="hover:bg-muted">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-muted"
          >
            <Link to="/store-ops/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>

          {/* User Menu */}
          <Dialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.imageUrl} alt={user?.firstName || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.[0] || "S"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sign out of Store Operations?</DialogTitle>
                <DialogDescription>
                  You'll need to sign in again to access your store operations dashboard.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSignOutDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.header>
  );
}