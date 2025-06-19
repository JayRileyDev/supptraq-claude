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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-8"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/20">
                Replaces $120K/year operations managers
              </span>
            </motion.div>

            {/* Headline with gradient text */}
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Take Back{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                Operational Control
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-white/80 lg:text-2xl"
            >
              Give your franchise the operational leverage of a $120K/year manager — without the payroll. Drop your POS reports, get complete visibility and control across all locations.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
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
                    <span className="relative z-10">Start Scaling with Supptraq</span>
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

          {/* Right column - Data Transformation Visual */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[600px] w-full flex items-center justify-center"
          >
            <div className="relative w-[550px] h-[500px] scale-110">
              
              {/* Left Side: Chaos Elements - Scattered POS Reports */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-36 h-96">
                {Array.from({ length: 24 }).map((_, i) => {
                  const initialY = (i * 20) % 380;
                  const initialX = Math.random() * 100;
                  const delay = (i % 12) * 0.5;
                  
                  return (
                    <motion.div
                      key={`chaos-${i}`}
                      initial={{ 
                        x: initialX,
                        y: initialY,
                        opacity: 0,
                        rotate: Math.random() * 50 - 25,
                        scale: 0.8 + Math.random() * 0.7
                      }}
                      animate={{
                        x: [initialX, initialX + Math.sin(i) * 18, 200],
                        y: [initialY, initialY + Math.cos(i) * 25, 200],
                        opacity: [0, 0.7, 0.9, 0.3, 0],
                        rotate: [Math.random() * 50 - 25, 0, 0],
                        scale: [0.8 + Math.random() * 0.7, 1.1, 0.5, 0]
                      }}
                      transition={{
                        duration: 6,
                        delay: delay,
                        repeat: Infinity,
                        repeatDelay: 2.5,
                        ease: "easeInOut"
                      }}
                      className="absolute"
                    >
                      {/* Different document types */}
                      {i % 4 === 0 && (
                        <div className="w-5 h-6 bg-white/25 rounded-sm backdrop-blur-sm border border-white/10">
                          <div className="w-3 h-0.5 bg-white/50 rounded mt-1 mx-auto"></div>
                          <div className="w-2 h-0.5 bg-white/40 rounded mt-0.5 mx-auto"></div>
                          <div className="w-2.5 h-0.5 bg-white/30 rounded mt-0.5 mx-auto"></div>
                        </div>
                      )}
                      {i % 4 === 1 && (
                        <div className="w-5 h-5 bg-white/20 rounded-full backdrop-blur-sm border border-white/10 flex items-end justify-center p-1">
                          <div className="flex space-x-px">
                            <div className="w-px h-2 bg-white/50"></div>
                            <div className="w-px h-1.5 bg-white/50"></div>
                            <div className="w-px h-2.5 bg-white/50"></div>
                          </div>
                        </div>
                      )}
                      {i % 4 === 2 && (
                        <div className="w-6 h-4 bg-white/25 rounded-sm backdrop-blur-sm border border-white/10 grid grid-cols-3 gap-px p-1">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <div key={j} className="bg-white/40 rounded-xs"></div>
                          ))}
                        </div>
                      )}
                      {i % 4 === 3 && (
                        <div className="w-4 h-5 bg-white/20 backdrop-blur-sm border border-white/10 rotate-45"></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Central Supptraq Processing Hub */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.8, delay: 0.8 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <div className="relative w-32 h-32">
                  {/* Outer processing ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-blue-400/40"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400/90 rounded-full"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-purple-400/70 rounded-full"></div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-blue-300/60 rounded-full"></div>
                  </motion.div>
                  
                  {/* Supptraq Icon Container */}
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/95 to-purple-600/95 shadow-2xl flex items-center justify-center border border-blue-400/30">
                    {/* Supptraq Icon */}
                    <svg 
                      viewBox="50 50 275 275" 
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 187.578125 53.109375 C 168.882812 58.0625 156.492188 67.972656 109.421875 115.269531 C 62.570312 162.796875 58.96875 167.976562 63.921875 185.320312 C 67.078125 197.03125 79.015625 211.671875 91.851562 219.554688 C 101.085938 225.183594 105.589844 226.535156 120.457031 227.214844 C 138.027344 227.890625 138.027344 227.890625 157.171875 209.195312 C 167.757812 199.058594 176.316406 189.375 176.316406 188.019531 C 176.316406 186.445312 169.558594 179.015625 161.453125 171.355469 C 150.863281 161.21875 147.261719 156.488281 149.0625 154.6875 C 150.414062 153.335938 165.953125 151.535156 183.746094 150.632812 C 205.820312 149.507812 218.207031 147.929688 222.710938 145.679688 C 232.621094 140.5 316.863281 54.910156 315.058594 51.980469 C 312.582031 47.929688 203.34375 48.828125 187.578125 53.109375 Z M 187.578125 53.109375"/>
                      <path d="M 239.382812 161.894531 C 230.148438 167.75 72.933594 327.667969 74.734375 329.46875 C 75.859375 330.597656 100.1875 331.046875 129.242188 330.597656 C 181.945312 329.921875 181.945312 329.921875 197.710938 322.484375 C 211.675781 315.957031 218.207031 310.324219 253.796875 274.285156 C 275.867188 251.765625 295.914062 230.140625 298.167969 226.535156 C 306.5 213.023438 302.898438 199.058594 287.355469 184.417969 C 264.382812 162.570312 249.515625 155.589844 239.382812 161.894531 Z M 239.382812 161.894531"/>
                    </svg>
                    
                    {/* Processing indicator */}
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute top-2 right-2 w-2 h-2 bg-white/90 rounded-full"
                    />
                  </div>
                  
                  {/* Energy pulse waves */}
                  {[1, 2, 3, 4].map((wave) => (
                    <motion.div
                      key={wave}
                      animate={{ 
                        scale: [1, 2.8, 2.8],
                        opacity: [0.4, 0.1, 0]
                      }}
                      transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        delay: wave * 0.6,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 rounded-full border border-blue-400/25"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Right Side: Multiple Organized Output Streams */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40">
                
                {/* Main energy distribution hub */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1.8, delay: 2.2, ease: "easeOut" }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-3 origin-left"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/90 via-purple-400/80 to-blue-300/70 shadow-lg relative overflow-hidden"
                       style={{ boxShadow: '0 0 25px rgba(59,130,246,0.4)' }}>
                    
                    {/* Flowing energy gradient */}
                    <motion.div
                      animate={{
                        background: [
                          'linear-gradient(90deg, rgba(59,130,246,0.9) 0%, rgba(147,51,234,0.8) 50%, rgba(147,197,253,0.7) 100%)',
                          'linear-gradient(90deg, rgba(147,51,234,0.8) 0%, rgba(147,197,253,0.7) 50%, rgba(59,130,246,0.9) 100%)',
                          'linear-gradient(90deg, rgba(59,130,246,0.9) 0%, rgba(147,51,234,0.8) 50%, rgba(147,197,253,0.7) 100%)'
                        ]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full"
                    />
                    
                    {/* Main flow particles */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={`main-flow-${i}`}
                        animate={{
                          x: [-4, 44],
                          opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          delay: 2.8 + i * 0.2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-white/95 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Operational Status Outputs */}
                {[
                  { 
                    label: 'Ordering', 
                    status: 'Automated', 
                    offset: -90, 
                    delay: 0,
                    icon: '📦'
                  },
                  { 
                    label: 'Sales Tracking', 
                    status: 'Complete', 
                    offset: 0, 
                    delay: 0.3,
                    icon: '📊'
                  },
                  { 
                    label: 'Operations', 
                    status: 'Optimized', 
                    offset: 90, 
                    delay: 0.6,
                    icon: '⚙️'
                  }
                ].map((operation, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 3.2 + operation.delay }}
                    className="absolute right-0"
                    style={{ top: `calc(50% + ${operation.offset}px)` }}
                  >
                    {/* Individual operation stream */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 3.4 + operation.delay }}
                      className="absolute right-40 top-1/2 -translate-y-1/2 w-10 h-1.5 origin-left"
                    >
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/60 to-purple-400/40 relative overflow-hidden">
                        {/* Stream particles */}
                        {Array.from({ length: 5 }).map((_, i) => (
                          <motion.div
                            key={`stream-${index}-${i}`}
                            animate={{
                              x: [-3, 36],
                              opacity: [0, 0.8, 0]
                            }}
                            transition={{
                              duration: 1.8,
                              delay: 3.8 + operation.delay + i * 0.3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-white/80 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>

                    {/* Status indicator */}
                    <div className="relative w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg border-2 border-white/30">
                      <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                        className="absolute inset-0.5 bg-white/80 rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </motion.div>
                    </div>
                    
                    {/* Operation status card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 3.6 + operation.delay }}
                      className="absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap"
                    >
                      <div className="bg-white/15 backdrop-blur-md rounded-lg px-4 py-2.5 shadow-lg border border-white/20">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm">{operation.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-white/90">{operation.label}</div>
                            <div className="text-sm text-green-300 font-semibold">{operation.status}</div>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Enhanced connection streams */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {Array.from({ length: 9 }).map((_, i) => {
                  const startY = 60 + i * 45;
                  const endY = 250;
                  const curvature = 180 + Math.sin(i) * 40;
                  
                  return (
                    <motion.path
                      key={`stream-${i}`}
                      d={`M 120 ${startY} Q ${curvature} ${startY + Math.sin(i) * 35} 270 ${endY}`}
                      stroke="rgba(59,130,246,0.25)"
                      strokeWidth="1.5"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 0.6, 0.6, 0]
                      }}
                      transition={{
                        duration: 4,
                        delay: 1.8 + i * 0.25,
                        repeat: Infinity,
                        repeatDelay: 3.5,
                        ease: "easeInOut"
                      }}
                    />
                  );
                })}
              </svg>

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