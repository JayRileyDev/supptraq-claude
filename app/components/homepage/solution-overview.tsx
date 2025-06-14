import { motion } from "framer-motion";
import { Upload, BarChart3, Target, FileText } from "lucide-react";

export default function SolutionOverview() {
  const steps = [
    {
      icon: Upload,
      title: "Upload",
      description: "Drag and drop your CSV files or PDFs. No complex integrations or IT setup required.",
      step: "01",
      color: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    {
      icon: BarChart3,
      title: "Analyze",
      description: "AI-powered algorithms instantly process your data to identify patterns and opportunities.",
      step: "02", 
      color: "from-purple-500 to-pink-500",
      delay: 0.2
    },
    {
      icon: Target,
      title: "Optimize",
      description: "Get actionable recommendations for reorders, pricing, and inventory management.",
      step: "03",
      color: "from-green-500 to-emerald-500",
      delay: 0.3
    },
    {
      icon: FileText,
      title: "Report",
      description: "Export professional reports to Excel or PDF for stakeholder presentations.",
      step: "04",
      color: "from-orange-500 to-red-500",
      delay: 0.4
    }
  ];

  return (
    <section id="solutions" className="relative w-full overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C] py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute top-1/4 -left-96 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 -right-96 h-[800px] w-[800px] rounded-full bg-purple-500/10 blur-3xl" />
      
      <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">  
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6"
          >
            Everything You Need to Run{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Smarter Operations
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-white/80 max-w-3xl mx-auto"
          >
            Transform your franchise operations with our simple 4-step process. No training required.
          </motion.p>
        </motion.div>

        {/* Steps flow */}
        <div className="relative">
          {/* Connection line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-blue-500/20 via-purple-500/40 to-cyan-500/20 hidden lg:block transform -translate-y-1/2"
          />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: step.delay }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  {/* Card */}
                  <div className="relative rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 group-hover:bg-white/10 transition-all duration-300">
                    {/* Step number */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: step.delay + 0.2 }}
                      viewport={{ once: true }}
                      className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                    >
                      <span className="text-white/90 font-bold text-sm">{step.step}</span>
                    </motion.div>

                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: step.delay + 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="mb-6"
                    >
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>

                    {/* Content */}
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: step.delay + 0.2 }}
                      viewport={{ once: true }}
                      className="text-2xl font-bold text-white mb-4"
                    >
                      {step.title}
                    </motion.h3>
                    
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: step.delay + 0.3 }}
                      viewport={{ once: true }}
                      className="text-white/70 leading-relaxed"
                    >
                      {step.description}
                    </motion.p>

                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl`} />
                  </div>

                  {/* Floating particles */}
                  <motion.div
                    animate={{ 
                      y: [0, -20, 0],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                    className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
                  />

                  {/* Connection arrow (mobile) */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: step.delay + 0.4 }}
                      viewport={{ once: true }}
                      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 lg:hidden"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/60 transform rotate-180" />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Ready in under 5 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}