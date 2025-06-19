import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Eye } from "lucide-react";

export default function ProblemSection() {
  const problems = [
    {
      icon: TrendingDown,
      title: "\"My managers are drowning in spreadsheets\"",
      description: "Your team spends hours every week cleaning data, building reports, and chasing numbers instead of driving sales and optimizing operations.",
      color: "from-red-500 to-orange-500",
      bgColor: "from-red-50 to-orange-50",
      accent: "bg-red-500"
    },
    {
      icon: AlertTriangle,
      title: "\"I don't know which stores are really performing\"",
      description: "Without real-time visibility into sales, inventory, and team performance, you're managing blind — reacting to problems instead of preventing them.",
      color: "from-orange-500 to-yellow-500",
      bgColor: "from-orange-50 to-yellow-50",
      accent: "bg-orange-500"
    },
    {
      icon: Eye,
      title: "\"Reordering takes forever and it's still wrong\"",
      description: "Manual inventory management means stockouts, overstock, and thousands in lost revenue. Your team wants to work smarter, not harder.",
      color: "from-purple-500 to-indigo-500",
      bgColor: "from-purple-50 to-indigo-50",
      accent: "bg-purple-500"
    }
  ];

  return (
    <section id="problem" className="relative w-full overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#ffffff] py-24 lg:py-32">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-red-100/30 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-orange-100/30 blur-3xl" />
      
      <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6"
          >
            Tired of{" "}
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Flying Blind?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Smart franchise owners are tired of hiring expensive managers just to get basic operational visibility. There's a better way.
          </motion.p>
        </motion.div>

        {/* Problems grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${problem.bgColor} opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-300`} />
                
                <div className="relative rounded-3xl bg-white p-8 shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Background accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${problem.color} opacity-5 rounded-full blur-2xl`} />
                  
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="mb-6 relative z-10"
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${problem.color} shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-2xl font-bold text-gray-900 mb-4 relative z-10"
                  >
                    {problem.title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-gray-600 leading-relaxed relative z-10"
                  >
                    {problem.description}
                  </motion.p>

                  {/* Accent bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                    viewport={{ once: true }}
                    className={`mt-6 h-1 rounded-full ${problem.accent} group-hover:h-2 transition-all duration-300`}
                  />
                </div>

                {/* Floating geometric decoration */}
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className={`absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br ${problem.color} opacity-20 blur-sm`}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA hint */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-300" />
            <span>There's a better way</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-300" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}