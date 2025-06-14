import { motion } from "framer-motion";
import { TrendingUp, Clock, Target } from "lucide-react";

export default function ResultsSection() {
  const results = [
    {
      metric: "23%",
      label: "Reduction in Stockouts",
      description: "Never miss a sale due to empty shelves again",
      icon: Target,
      color: "from-green-500 to-emerald-500"
    },
    {
      metric: "31%",
      label: "Faster Reordering",
      description: "Automated alerts and smart recommendations",
      icon: Clock,
      color: "from-blue-500 to-cyan-500"
    },
    {
      metric: "15+",
      label: "Hours Saved Weekly",
      description: "Time freed up for strategic decisions",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500"
    }
  ];

  const testimonial = {
    quote: "Supptraq transformed how we manage inventory across our 12 locations. We went from reactive firefighting to proactive optimization. Our profit margins improved 18% in just 6 months.",
    author: "Marcus Thompson",
    title: "Regional Operations Manager",
    company: "NutriZone Franchises"
  };

  return (
    <section id="results" className="relative w-full overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#ffffff] py-24 lg:py-32">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-green-100/40 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-100/40 blur-3xl" />
      
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
            Drive{" "}
            <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Real Results
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Join hundreds of franchise operators who've transformed their operations with data-driven decisions
          </motion.p>
        </motion.div>

        {/* Results grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12 mb-20">
          {results.map((result, index) => {
            const Icon = result.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative text-center"
              >
                {/* Background glow */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${result.color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-300`} />
                
                <div className="relative rounded-3xl bg-white p-8 shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="mb-6 flex justify-center"
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${result.color} shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Metric */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="mb-4"
                  >
                    <div className={`text-5xl font-bold bg-gradient-to-r ${result.color} bg-clip-text text-transparent mb-2`}>
                      {result.metric}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {result.label}
                    </h3>
                  </motion.div>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-gray-600 leading-relaxed"
                  >
                    {result.description}
                  </motion.p>

                  {/* Animated counter effect */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                    className={`absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gradient-to-r ${result.color} opacity-60`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl bg-white p-8 lg:p-12 shadow-2xl border border-gray-100">
            {/* Quote decoration */}
            <div className="absolute top-6 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>

            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl lg:text-2xl text-gray-800 leading-relaxed mb-8 pl-16"
            >
              "{testimonial.quote}"
            </motion.blockquote>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center space-x-4 pl-16"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-bold text-lg">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-bold text-gray-900">{testimonial.author}</div>
                <div className="text-gray-600">{testimonial.title}</div>
                <div className="text-sm text-gray-500">{testimonial.company}</div>
              </div>
            </motion.div>

            {/* Geometric decoration */}
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
              className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-30 blur-sm"
            />
          </div>
        </motion.div>

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
            <span>Ready to see similar results?</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-300" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}