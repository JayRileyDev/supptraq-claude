import { motion } from "framer-motion";
import { Upload, Cpu, Download, MousePointer } from "lucide-react";

export default function WorkflowSection() {
  const workflowSteps = [
    {
      icon: MousePointer,
      title: "Drag & Drop Upload",
      description: "Simply drag your CSV or PDF files into the interface. No complex file formatting or data preparation required."
    },
    {
      icon: Cpu,
      title: "Automated Processing",
      description: "Our AI instantly analyzes your data, identifies patterns, and generates insights without any manual intervention."
    },
    {
      icon: Download,
      title: "Export to Excel/PDF",
      description: "Get professional reports in your preferred format. Perfect for board meetings and stakeholder presentations."
    }
  ];

  const integrationLogos = [
    { name: "Excel", color: "from-green-500 to-green-600" },
    { name: "PDF", color: "from-red-500 to-red-600" },
    { name: "CSV", color: "from-blue-500 to-blue-600" },
    { name: "Drive", color: "from-yellow-500 to-orange-500" }
  ];

  return (
    <section id="workflow" className="relative w-full overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C] py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-green-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      
      <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center lg:gap-20">
          
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
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
                Built for Your{" "}
                <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Workflow
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-white/80"
              >
                No training required. No complex integrations. Just results.
              </motion.p>
            </div>

            {/* Workflow steps */}
            <div className="space-y-8">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
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
                      className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-green-500/25 transition-all duration-300"
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Integration logos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              viewport={{ once: true }}
              className="pt-8"
            >
              <div className="text-white/60 text-sm mb-4">Works with your existing tools:</div>
              <div className="flex items-center space-x-4">
                {integrationLogos.map((logo, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.1 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${logo.color} flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-white font-bold text-xs">{logo.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Workflow Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-8">
              {/* Upload Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <div className="rounded-2xl border-2 border-dashed border-white/20 p-8 text-center bg-white/5">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <Upload className="w-12 h-12 text-white/60 mx-auto" />
                  </motion.div>
                  <div className="text-white/80 font-medium mb-2">Drop your files here</div>
                  <div className="text-white/60 text-sm">CSV, PDF, or Excel files</div>
                </div>
              </motion.div>

              {/* Processing Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="mb-8 flex items-center justify-center"
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-full border-2 border-white/20 border-t-blue-400"
                  />
                  <span className="text-white/80">Processing...</span>
                </div>
              </motion.div>

              {/* Results Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="text-white/80 font-medium mb-4">Generated Reports:</div>
                
                {/* Report items */}
                {[
                  { name: "Inventory Analysis.pdf", size: "2.4 MB", type: "PDF" },
                  { name: "Reorder Recommendations.xlsx", size: "1.8 MB", type: "Excel" },
                  { name: "Sales Performance.pdf", size: "3.1 MB", type: "PDF" }
                ].map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg ${
                        file.type === 'PDF' ? 'bg-red-500' : 'bg-green-500'
                      } flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">{file.type}</span>
                      </div>
                      <div>
                        <div className="text-white/90 font-medium text-sm">{file.name}</div>
                        <div className="text-white/60 text-xs">{file.size}</div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-8 -right-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 opacity-20 blur-xl"
            />
            
            <motion.div
              animate={{ 
                y: [0, 15, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -bottom-8 -left-8 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 opacity-20 blur-xl"
            />
          </motion.div>
        </div>

        {/* Bottom highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Average setup time: Under 2 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}