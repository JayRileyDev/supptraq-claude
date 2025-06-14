import { Link } from "react-router";
import { Github, Twitter, Linkedin, Mail, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";

const productLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Security", href: "#security" },
  { name: "API Docs", href: "#docs" },
];

const companyLinks = [
  { name: "About", href: "#about" },
  { name: "Blog", href: "#blog" },
  { name: "Careers", href: "#careers" },
  { name: "Contact", href: "#contact" },
];

const resourceLinks = [
  { name: "Help Center", href: "#help" },
  { name: "Case Studies", href: "#case-studies" },
  { name: "Templates", href: "#templates" },
  { name: "Integrations", href: "#integrations" },
];

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/supptraq" },
  { name: "GitHub", icon: Github, href: "https://github.com/supptraq" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/supptraq" },
  { name: "Email", icon: Mail, href: "mailto:hello@supptraq.com" },
];

export default function FooterSection() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C]">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Main footer content */}
        <div className="py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Company info - 4 columns */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                {/* Logo */}
                <Link to="/" aria-label="go home" className="inline-block mb-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur" />
                      <img src="/rsk.png" alt="SuppTraq Logo" className="relative h-12 w-12" />
                    </div>
                    <span className="text-2xl font-bold text-white">SuppTraq</span>
                  </motion.div>
                </Link>

                {/* Description */}
                <p className="text-white/70 leading-relaxed mb-8 max-w-sm">
                  Transform your franchise operations with AI-powered inventory and sales analytics. Built specifically for supplement retail operators.
                </p>

                {/* Key features */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: BarChart3, text: "Real-time Analytics" },
                    { icon: Zap, text: "AI-Powered Insights" },
                    { icon: Shield, text: "Enterprise Security" }
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-white/80 text-sm">{feature.text}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Newsletter signup */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <h3 className="text-white font-semibold mb-3">Stay Updated</h3>
                  <div className="flex space-x-2">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Links - 8 columns */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                
                {/* Product */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-6">Product</h3>
                  <ul className="space-y-4">
                    {productLinks.map((link, index) => (
                      <li key={link.name}>
                        <motion.a
                          href={link.href}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                          viewport={{ once: true }}
                          whileHover={{ x: 4, color: "#60a5fa" }}
                          className="text-white/70 hover:text-blue-400 transition-colors text-sm"
                        >
                          {link.name}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Company */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-6">Company</h3>
                  <ul className="space-y-4">
                    {companyLinks.map((link, index) => (
                      <li key={link.name}>
                        <motion.a
                          href={link.href}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                          viewport={{ once: true }}
                          whileHover={{ x: 4, color: "#60a5fa" }}
                          className="text-white/70 hover:text-blue-400 transition-colors text-sm"
                        >
                          {link.name}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Resources */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-6">Resources</h3>
                  <ul className="space-y-4">
                    {resourceLinks.map((link, index) => (
                      <li key={link.name}>
                        <motion.a
                          href={link.href}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                          viewport={{ once: true }}
                          whileHover={{ x: 4, color: "#60a5fa" }}
                          className="text-white/70 hover:text-blue-400 transition-colors text-sm"
                        >
                          {link.name}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Social & Contact */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-6">Connect</h3>
                  
                  {/* Social icons */}
                  <div className="flex space-x-3 mb-6">
                    {socialLinks.map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <motion.a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -2, scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-blue-400 hover:bg-white/20 transition-all duration-300"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="sr-only">{social.name}</span>
                        </motion.a>
                      );
                    })}
                  </div>

                  {/* Contact info */}
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      viewport={{ once: true }}
                      className="text-white/70 text-sm"
                    >
                      hello@supptraq.com
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                      viewport={{ once: true }}
                      className="text-white/70 text-sm"
                    >
                      1-800-SUPPTRAQ
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="py-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-6">
              <p className="text-white/60 text-sm">
                © {new Date().getFullYear()} SuppTraq. All rights reserved.
              </p>
              <div className="hidden md:flex items-center space-x-1 text-white/40 text-xs">
                <span>Made with</span>
                <span className="text-red-400">♥</span>
                <span>for franchise operators</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <motion.a
                href="#privacy"
                whileHover={{ y: -1, color: "#60a5fa" }}
                className="text-white/60 hover:text-blue-400 transition-colors text-sm"
              >
                Privacy Policy
              </motion.a>
              <motion.a
                href="#terms"
                whileHover={{ y: -1, color: "#60a5fa" }}
                className="text-white/60 hover:text-blue-400 transition-colors text-sm"
              >
                Terms of Service
              </motion.a>
              <motion.a
                href="#cookies"
                whileHover={{ y: -1, color: "#60a5fa" }}
                className="text-white/60 hover:text-blue-400 transition-colors text-sm"
              >
                Cookie Policy
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}