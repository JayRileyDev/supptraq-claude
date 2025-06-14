import { motion } from "framer-motion";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function PricingCTA() {
  const pricingTiers = [
    {
      name: "Starter",
      price: "$49",
      period: "per location/month",
      description: "Perfect for single-location franchises",
      features: [
        "Up to 1,000 inventory items",
        "Monthly analysis reports",
        "Basic reorder recommendations",
        "Email support",
        "CSV/PDF exports"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      price: "$89",
      period: "per location/month", 
      description: "Best for growing franchise operations",
      features: [
        "Up to 5,000 inventory items",
        "Weekly analysis reports",
        "Advanced AI recommendations",
        "Sales performance tracking",
        "Priority support",
        "Custom report templates",
        "Vendor budget management"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing available",
      description: "For large franchise networks",
      features: [
        "Unlimited inventory items",
        "Real-time analytics",
        "Custom AI model training",
        "Multi-location dashboards",
        "Dedicated account manager",
        "API access",
        "White-label options",
        "Advanced integrations"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="relative w-full overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C] py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />
      
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
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6"
          >
            Start Optimizing{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Today
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-white/80 max-w-3xl mx-auto"
          >
            Choose the plan that fits your franchise operation. All plans include a 14-day free trial.
          </motion.p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`group relative ${tier.popular ? 'lg:-mt-8' : ''}`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                  viewport={{ once: true }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <div className="inline-flex items-center space-x-1 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </motion.div>
              )}

              {/* Card background glow */}
              <div className={`absolute inset-0 rounded-3xl ${
                tier.popular 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                  : 'bg-white/5'
              } blur-xl group-hover:${
                tier.popular ? 'from-blue-500/30 to-purple-500/30' : 'bg-white/10'
              } transition-all duration-300`} />
              
              <div className={`relative rounded-3xl backdrop-blur-sm border p-8 ${
                tier.popular 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/5 border-white/10'
              } group-hover:bg-white/15 transition-all duration-300`}>
                
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-2xl font-bold text-white mb-4"
                  >
                    {tier.name}
                  </motion.h3>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="mb-4"
                  >
                    <div className="text-4xl font-bold text-white mb-2">
                      {tier.price}
                    </div>
                    <div className="text-white/60 text-sm">{tier.period}</div>
                  </motion.div>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-white/70"
                  >
                    {tier.description}
                  </motion.p>
                </div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="space-y-4 mb-8"
                >
                  {tier.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 + featureIndex * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/80">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant={tier.buttonVariant}
                      size="lg"
                      className={`w-full py-6 text-lg rounded-2xl group ${
                        tier.buttonVariant === 'default'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-2xl shadow-blue-500/25'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm'
                      }`}
                      asChild
                    >
                      <Link to={tier.name === "Enterprise" ? "/contact" : "/sign-up"}>
                        <span className="relative z-10">{tier.buttonText}</span>
                        <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1 relative z-10" />
                        {tier.buttonVariant === 'default' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        )}
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { title: "14-day free trial", subtitle: "No credit card required" },
              { title: "Cancel anytime", subtitle: "No long-term contracts" },
              { title: "30-day money back", subtitle: "Risk-free guarantee" }
            ].map((guarantee, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-white font-medium">{guarantee.title}</div>
                <div className="text-white/60 text-sm">{guarantee.subtitle}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-2 text-white/60 text-sm">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/30" />
            <span>Ready to transform your franchise operations?</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/30" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}