import { Bell, Search, HelpCircle, Settings, LogOut, Sparkles } from "lucide-react";
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

// Animated Greeting Component
function AnimatedGreeting({ user }: { user: any }) {
  const [isVisible, setIsVisible] = useState(false);
  const greeting = getCurrentTime();
  const userName = user?.firstName || "User";
  const emoji = getGreetingEmoji();
  const gradientColor = getGreetingColor();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Split greeting and name into words for staggered animation
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
        type: "spring" as const,
        damping: 12,
        stiffness: 200
      }
    }
  };

  const emojiVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring" as const,
        damping: 10,
        stiffness: 200,
        delay: 0.8
      }
    }
  };

  const sparkleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 0.8],
      transition: {
        duration: 0.6,
        delay: 1.2,
        times: [0, 0.5, 1]
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="flex items-center gap-2 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated Emoji */}
        <motion.span
          variants={emojiVariants}
          className="text-xl"
          animate={{
            y: [0, -3, 0, -1, 0],
            rotate: [0, 5, -5, 3, -3, 0],
            scale: [1, 1.05, 1, 1.02, 1]
          }}
          transition={{
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotate: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {emoji}
        </motion.span>

        {/* Animated Greeting Text */}
        <div className="flex items-center gap-1 flex-wrap">
          {greetingWords.map((word, index) => (
            <motion.span
              key={index}
              variants={wordVariants}
              className={cn(
                "text-lg font-semibold bg-gradient-to-r bg-clip-text text-transparent",
                gradientColor
              )}
              animate={{
                y: [0, -1, 0],
              }}
              transition={{
                y: {
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2 + index * 0.2
                }
              }}
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            variants={wordVariants}
            className="text-lg font-semibold text-foreground"
            animate={{
              y: [0, -1, 0],
            }}
            transition={{
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.4
              }
            }}
          >
            ,
          </motion.span>
          <motion.span
            variants={wordVariants}
            className="text-lg font-semibold text-foreground relative"
            animate={{
              y: [0, -1, 0],
            }}
            transition={{
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.6
              }
            }}
          >
            {userName}
            
            {/* Sparkle Effect */}
            <motion.div
              variants={sparkleVariants}
              className="absolute -top-1 -right-1"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: {
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3
                }
              }}
            >
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </motion.div>
          </motion.span>
        </div>
      </motion.div>

      {/* Shimmer Effect */}
      <motion.div
        initial={{ x: "-150%" }}
        animate={{ x: "150%" }}
        transition={{
          duration: 2.5,
          delay: 1.5,
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, transparent 20%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 60%, transparent 80%, transparent 100%)",
          width: "200%",
          left: "-50%"
        }}
      />
    </div>
  );
}

function getCurrentTime() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "🌅";
  if (hour < 17) return "☀️";
  return "🌙";
}

function getGreetingColor() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "from-orange-400 via-pink-400 to-purple-400"; // Morning gradient
  if (hour < 17) return "from-yellow-400 via-orange-400 to-red-400"; // Afternoon gradient
  return "from-purple-400 via-blue-400 to-indigo-400"; // Evening gradient
}

export function EnhancedTopbar({ className }: EnhancedTopbarProps) {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const currentPageName = pageNames[location.pathname] || "Dashboard";
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);


  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card border-b border-border backdrop-blur-sm", className)}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section - Animated Greeting */}
        <div className="flex items-center space-x-4">
          <div>
            <AnimatedGreeting user={user} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="flex items-center space-x-2 text-sm text-muted-foreground mt-1"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.0, duration: 0.4 }}
              >
                Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </motion.span>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.2, duration: 0.4 }}
              >
                <Badge variant="secondary" className="text-xs">
                  {currentPageName}
                </Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>


        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Log Out Button */}
          <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:border-red-700 dark:hover:text-red-300 hover:scale-105 transition-all duration-200 group shadow-sm"
              >
                <LogOut className="h-4 w-4 sm:mr-2 group-hover:rotate-12 transition-transform duration-200" />
                <span className="hidden sm:inline font-medium">Sign Out</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-red-500" />
                  Sign Out
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to sign out? You'll need to sign in again to access your dashboard.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setLogoutDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setLogoutDialogOpen(false);
                    signOut({ redirectUrl: "/" });
                  }}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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