import { useUser } from "@clerk/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
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
  Store
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function StoreOpsLayout() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser);
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Mark this as a Store Ops login
      upsertUser({ isStoreOps: true });
    }
  }, [isLoaded, user, upsertUser]);

  // Redirect non-authenticated users
  useEffect(() => {
    if (isLoaded && !user) {
      navigate("/sign-in");
    }
  }, [isLoaded, user, navigate]);

  // Loading state
  if (!isLoaded || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 animate-pulse text-blue-600" />
          <p className="mt-4 text-gray-600">Loading Store Operations Portal...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/store-ops", icon: LayoutDashboard },
    { name: "Operational Info", href: "/store-ops/operational", icon: FileText },
    { name: "Averages", href: "/store-ops/averages", icon: TrendingUp },
    { name: "Daily Checklist", href: "/store-ops/daily-checklist", icon: CheckSquare },
    { name: "SL Checklist", href: "/store-ops/sl-checklist", icon: Shield },
    { name: "DL Checklist", href: "/store-ops/dl-checklist", icon: ClipboardList },
    { name: "Returns", href: "/store-ops/returns", icon: Package },
    { name: "Callback List", href: "/store-ops/callbacks", icon: Phone },
    { name: "Close-Dated", href: "/store-ops/close-dated", icon: AlertTriangle },
    { name: "Tablet Counts", href: "/store-ops/tablet-counts", icon: Package },
    { name: "Cleaning Sheet", href: "/store-ops/cleaning", icon: Sparkles },
    { name: "Ordering Budget", href: "/store-ops/budget", icon: DollarSign },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b">
          <Store className="h-8 w-8 text-blue-600" />
          <h1 className="ml-2 text-xl font-bold">Store Ops</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = window.location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-blue-50 text-blue-700"
                )}
                asChild
              >
                <a href={item.href}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </a>
              </Button>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-4 text-sm">
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-gray-500">{currentUser.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              window.location.href = "/sign-in";
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}