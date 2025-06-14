import { motion } from "framer-motion";
import { Shield, Lock, Eye, Award } from "lucide-react";

export default function TrustSecurity() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Bank-level encryption protects your sensitive business data"
    },
    {
      icon: Lock,
      title: "SOC 2 Compliant",
      description: "Independently audited for security and availability"
    },
    {
      icon: Eye,
      title: "Private & Secure",
      description: "Your data never leaves our secure infrastructure"
    },
    {
      icon: Award,
      title: "GDPR Compliant",
      description: "Full compliance with international data protection regulations"
    }
  ];

  const customerLogos = [
    { name: "NutriZone", locations: "12 locations" },
    { name: "VitaMax", locations: "8 locations" },
    { name: "SupplementHub", locations: "15 locations" },
    { name: "PowerFuel", locations: "6 locations" },
    { name: "FitNutrition", locations: "22 locations" },
    { name: "ProSupps", locations: "9 locations" }
  ];

  return (
    <section id="security" className="relative w-full overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#ffffff] py-24 lg:py-32">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-100/30 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-green-100/30 blur-3xl" />
      
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
            Enterprise-Grade{" "}
            <span className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 bg-clip-text text-transparent">
              Security
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Your sensitive business data deserves the highest level of protection
          </motion.p>
        </motion.div>

        {/* Security features grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-4 mb-20">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group text-center"
              >
                <div className="relative rounded-3xl bg-white p-8 shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="mb-6 flex justify-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-600 shadow-lg">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-xl font-bold text-gray-900 mb-4"
                  >
                    {feature.title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-gray-600 leading-relaxed"
                  >
                    {feature.description}
                  </motion.p>

                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Compliance badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="text-gray-500 text-sm mb-6">Certified & Compliant</div>
          <div className="flex items-center justify-center space-x-8">
            {['SOC 2', 'GDPR', 'ISO 27001', 'CCPA'].map((badge, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                viewport={{ once: true }}
                className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-lg"
              >
                <span className="text-gray-600 font-bold text-xs">{badge}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Customer logos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="text-gray-500 text-sm mb-8">Trusted by leading franchise operators</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {customerLogos.map((customer, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="group text-center"
              >
                <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                  <span className="text-gray-600 font-bold text-sm">{customer.name}</span>
                </div>
                <div className="text-xs text-gray-500">{customer.locations}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-700 leading-relaxed">
              We take data security seriously. Your business information is encrypted, regularly backed up, and never shared with third parties. Our infrastructure meets the highest industry standards for data protection.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}