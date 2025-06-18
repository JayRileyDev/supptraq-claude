import { motion } from "framer-motion";

interface LoadingProps {
  message?: string;
  submessage?: string;
}

export function Loading({ message = "Loading...", submessage }: LoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        {/* Custom Spinner */}
        <div className="relative">
          <motion.div
            className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full mx-auto mt-2 ml-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <motion.p
            className="text-lg font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.p>
          {submessage && (
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {submessage}
            </motion.p>
          )}
        </div>

        {/* Progress dots */}
        <motion.div
          className="flex justify-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <Loading 
      message="Setting up your dashboard..." 
      submessage="Please wait while we prepare your workspace"
    />
  );
}

export function AuthLoading() {
  return (
    <Loading 
      message="Signing you in..." 
      submessage="Redirecting to your dashboard"
    />
  );
}