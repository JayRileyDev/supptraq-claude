import { motion } from "framer-motion";
import { Brain, Zap, Search, TrendingUp } from "lucide-react";

export default function AIIntelligence() {
  const aiFeatures = [
    {
      icon: Search,
      title: "Pattern Recognition",
      description: "Automatically identifies sales patterns, seasonal trends, and inventory anomalies across all your locations."
    },
    {
      icon: TrendingUp,
      title: "Anomaly Detection", 
      description: "Spots unusual inventory movements or sales spikes before they become problems or missed opportunities."
    },
    {
      icon: Brain,
      title: "Predictive Recommendations",
      description: "Provides intelligent forecasting for demand, optimal pricing, and inventory management decisions."
    }
  ];

  return (
    <section id="ai" className="relative w-full overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C] py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
      
      {/* Neural network background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-2 h-2 rounded-full bg-blue-400" />
        <div className="absolute top-40 left-60 w-1 h-1 rounded-full bg-purple-400" />
        <div className="absolute top-60 left-40 w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <div className="absolute bottom-40 right-40 w-2 h-2 rounded-full bg-pink-400" />
        <div className="absolute bottom-60 right-80 w-1 h-1 rounded-full bg-green-400" />
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          <motion.line
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            viewport={{ once: true }}
            x1="5%" y1="20%" x2="25%" y2="40%" 
            stroke="url(#gradient1)" strokeWidth="1" strokeDasharray="2,4"
          />
          <motion.line
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.7 }}
            viewport={{ once: true }}
            x1="25%" y1="40%" x2="15%" y2="60%" 
            stroke="url(#gradient2)" strokeWidth="1" strokeDasharray="2,4"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center lg:gap-20">
          
          {/* Left side - AI Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Central AI Brain */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"
              >
                {/* Inner glow */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-xl" />
                
                {/* Brain icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10"
                >
                  <Brain className="w-24 h-24 text-white/90" />
                </motion.div>

                {/* Floating data points */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 6 + i,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-60"
                    style={{
                      top: `${20 + Math.sin(i * Math.PI / 4) * 35}%`,
                      left: `${50 + Math.cos(i * Math.PI / 4) * 35}%`,
                    }}
                  />
                ))}
              </motion.div>

              {/* Orbiting elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="relative w-full h-full rounded-full">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col space-y-8"
          >
            {/* Header */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-4"
              >
                Let AI Handle the{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Analysis
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-white/80"
              >
                Upload historical data, get instant insights without manual work
              </motion.p>
            </div>

            {/* AI Features */}
            <div className="space-y-8">
              {aiFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-4 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300"
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90 font-medium">Powered by Advanced Machine Learning</span>
              </div>
              <p className="text-white/70 text-sm">
                Our AI models are trained on millions of retail data points to provide accurate, actionable insights specific to supplement franchise operations.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
        >
          {[
            { value: "99.7%", label: "Accuracy Rate" },
            { value: "<5min", label: "Processing Time" },
            { value: "24/7", label: "Continuous Learning" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/70">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}