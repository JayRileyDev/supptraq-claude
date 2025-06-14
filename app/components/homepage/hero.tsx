import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C] pt-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(71,139,235,0.15),_transparent_50%)]" />
      <div className="absolute top-1/4 -right-96 h-[800px] w-[800px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 -left-96 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-3xl" />

      <div className="container relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 lg:px-12">
        {/* Main content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Left column - Text content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col space-y-8"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/20">
                Trusted by 200+ franchise locations
              </span>
            </motion.div>

            {/* Headline with gradient text */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Turn Messy Inventory Data Into{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                Clear Decisions
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/80 lg:text-2xl"
            >
              The analytics platform built for supplement franchise operations. Upload your CSVs, get actionable insights in seconds.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 px-8 py-6 text-lg group rounded-2xl shadow-2xl shadow-blue-500/25"
                  asChild
                >
                  <Link to="/sign-up">
                    <span className="relative z-10">Start Free Analysis</span>
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg rounded-2xl"
                  asChild
                >
                  <Link to="#demo">
                    View Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right column - Animated Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative h-[600px] w-full"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Glowing backdrop */}
              <div className="absolute h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-3xl" />

              {/* Dashboard cards with floating animation */}
              <div className="relative h-full w-full max-w-[500px]">
                {/* Main dashboard card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="absolute top-0 left-0 right-0 rounded-2xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl border border-white/20"
                >
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="h-6 w-32 rounded-full bg-gradient-to-r from-gray-200 to-gray-300"></div>
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4"
                    >
                      <div className="h-3 w-16 rounded-full bg-blue-300 mb-2"></div>
                      <div className="h-8 w-12 rounded-md bg-blue-500 mb-1"></div>
                      <div className="h-2 w-8 rounded-full bg-blue-400"></div>
                    </motion.div>
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.3 }}
                      className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4"
                    >
                      <div className="h-3 w-16 rounded-full bg-green-300 mb-2"></div>
                      <div className="h-8 w-12 rounded-md bg-green-500 mb-1"></div>
                      <div className="h-2 w-8 rounded-full bg-green-400"></div>
                    </motion.div>
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                      className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4"
                    >
                      <div className="h-3 w-16 rounded-full bg-purple-300 mb-2"></div>
                      <div className="h-8 w-12 rounded-md bg-purple-500 mb-1"></div>
                      <div className="h-2 w-8 rounded-full bg-purple-400"></div>
                    </motion.div>
                  </div>

                  {/* Chart area */}
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4"
                  >
                    <div className="flex justify-between mb-4">
                      <div className="h-3 w-24 rounded-full bg-gray-300"></div>
                      <div className="h-3 w-16 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="flex items-end space-x-1">
                      {[16, 12, 20, 14, 10, 16, 8, 12, 18, 22, 14, 16].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height * 4}px` }}
                          transition={{ duration: 0.5, delay: 1.8 + i * 0.1 }}
                          className="w-4 rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400"
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Floating notification card */}
                <motion.div 
                  initial={{ y: -20, opacity: 0, x: 20 }}
                  animate={{ y: 0, opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1.0 }}
                  className="absolute top-[15%] -right-12 w-64 rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-xl border border-white/20"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500"></div>
                    <div className="h-3 w-32 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-gray-200"></div>
                    <div className="h-2 w-3/4 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div className="h-6 w-16 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                      <div className="h-2 w-8 rounded-full bg-white"></div>
                    </div>
                    <div className="h-6 w-16 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <div className="h-2 w-8 rounded-full bg-white"></div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating analytics card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0, x: -20 }}
                  animate={{ y: 0, opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1.1 }}
                  className="absolute top-[60%] -left-12 w-48 rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-xl border border-white/20"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                    <div className="h-2 w-20 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-3">
                    <div className="flex justify-between mb-2">
                      <div className="h-2 w-12 rounded-full bg-blue-300"></div>
                      <div className="h-2 w-8 rounded-full bg-blue-400"></div>
                    </div>
                    <div className="h-4 w-full rounded-md bg-white mb-2"></div>
                    <div className="h-1 w-3/4 rounded-full bg-blue-200"></div>
                  </div>
                </motion.div>

                {/* Continuous floating animation for all cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex flex-col items-center text-white/60"
          >
            <div className="mb-2 text-sm font-medium">Scroll to explore</div>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}