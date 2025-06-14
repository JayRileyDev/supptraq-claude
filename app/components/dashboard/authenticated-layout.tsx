import { EnhancedSidebar } from "~/components/dashboard/enhanced-sidebar";
import { EnhancedTopbar } from "~/components/dashboard/enhanced-topbar";
import { useUser } from "@clerk/react-router";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <EnhancedSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <EnhancedTopbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}