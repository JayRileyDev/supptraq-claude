import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, DollarSign, BarChart3, Users, ShoppingCart } from "lucide-react";

export default function FeaturesDeepDive() {
  const features = [
    {
      title: "Smart Reorder Recommendations",
      subtitle: "AI-powered inventory optimization",
      description: "Never run out of stock again. Our AI analyzes sales patterns, seasonal trends, and lead times to recommend optimal reorder quantities and timing.",
      icon: RefreshCw,
      benefits: [
        "Reduce stockouts by 45%",
        "Optimize cash flow",
        "Automate reorder alerts"
      ],
      mockup: {
        title: "Reorder Dashboard",
        items: [
          { name: "Whey Protein 5lb", status: "reorder", qty: "24 units", color: "bg-red-500" },
          { name: "Creatine Monohydrate", status: "optimal", qty: "18 units", color: "bg-green-500" },
          { name: "Pre-Workout Mix", status: "overstock", qty: "45 units", color: "bg-orange-500" }
        ]
      },
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-[#f8fafc] to-[#ffffff]"
    },
    {
      title: "Sales Performance Analytics", 
      subtitle: "Rep and location tracking",
      description: "Track individual sales rep performance across multiple locations. Identify top performers, spot trends, and optimize territories for maximum revenue.",
      icon: TrendingUp,
      benefits: [
        "Identify top performers",
        "Optimize territories", 
        "Track commission accuracy"
      ],
      mockup: {
        title: "Sales Analytics",
        chart: true,
        metrics: [
          { label: "Total Sales", value: "$124,500", change: "+12%" },
          { label: "Top Rep", value: "Sarah M.", change: "18 sales" },
          { label: "Avg Deal", value: "$425", change: "+8%" }
        ]
      },
      gradient: "from-purple-500 to-pink-500", 
      bgGradient: "from-[#090A0C] to-[#1a1d21]"
    },
    {
      title: "Vendor Budget Management",
      subtitle: "Spend tracking and receivings",
      description: "Monitor vendor spend, track receivings, and manage budgets across all locations. Identify the most profitable vendor relationships.",
      icon: DollarSign,
      benefits: [
        "Track vendor ROI",
        "Monitor budget utilization",
        "Optimize vendor mix"
      ],
      mockup: {
        title: "Vendor Dashboard", 
        vendors: [
          { name: "Optimum Nutrition", spend: "$45,200", budget: "$50,000", utilization: 90 },
          { name: "BSN Supplements", spend: "$32,100", budget: "$40,000", utilization: 80 },
          { name: "Dymatize", spend: "$28,900", budget: "$35,000", utilization: 83 }
        ]
      },
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-[#f8fafc] to-[#ffffff]"
    }
  ];

  return (
    <section id="features" className="relative w-full overflow-hidden">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isEven = index % 2 === 0;
        
        return (
          <div 
            key={index}
            className={`relative w-full py-24 lg:py-32 ${
              isEven 
                ? `bg-gradient-to-br ${feature.bgGradient}` 
                : 'bg-gradient-to-br from-[#090A0C] via-[#1a1d21] to-[#090A0C]'
            }`}
          >
            {/* Background effects */}
            <div className={`absolute ${isEven ? 'top-1/4 right-1/4' : 'bottom-1/4 left-1/4'} h-[600px] w-[600px] rounded-full ${
              isEven ? 'bg-gray-100/20' : 'bg-purple-500/10'
            } blur-3xl`} />
            
            <div className="container relative mx-auto max-w-7xl px-6 lg:px-12">
              <div className={`grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center ${
                isEven ? '' : 'lg:grid-flow-col-dense'
              }`}>
                
                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className={`${isEven ? '' : 'lg:col-start-2'} flex flex-col space-y-8`}
                >
                  {/* Icon and title */}
                  <div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      viewport={{ once: true }}
                      className="mb-6"
                    >
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      viewport={{ once: true }}
                      className={`text-3xl font-bold mb-2 lg:text-4xl ${
                        isEven ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      {feature.title}
                    </motion.h3>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      viewport={{ once: true }}
                      className={`text-lg font-medium ${
                        isEven ? 'text-gray-600' : 'text-white/80'
                      }`}
                    >
                      {feature.subtitle}
                    </motion.p>
                  </div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className={`text-xl leading-relaxed ${
                      isEven ? 'text-gray-700' : 'text-white/80'
                    }`}
                  >
                    {feature.description}
                  </motion.p>

                  {/* Benefits */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="space-y-4"
                  >
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <motion.div
                        key={benefitIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + benefitIndex * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-3"
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                        <span className={`font-medium ${
                          isEven ? 'text-gray-800' : 'text-white/90'
                        }`}>
                          {benefit}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Mockup */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className={`${isEven ? '' : 'lg:col-start-1'} relative`}
                >
                  <div className="relative rounded-3xl bg-white shadow-2xl border border-gray-100 p-6 overflow-hidden">
                    {/* Background gradient accent */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-full blur-2xl`} />
                    
                    {/* Header */}
                    <div className="relative flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900">{feature.mockup.title}</h4>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                    </div>

                    {/* Reorder Dashboard */}
                    {feature.mockup.items && (
                      <div className="relative space-y-3">
                        {feature.mockup.items.map((item, itemIndex) => (
                          <motion.div
                            key={itemIndex}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + itemIndex * 0.1 }}
                            viewport={{ once: true }}
                            className="group relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-all duration-300 relative z-10">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full ${item.color} shadow-lg`} />
                                <div>
                                  <div className="font-medium text-gray-900">{item.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">{item.status} needed</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">{item.qty}</div>
                                <div className="text-xs text-gray-500">recommended</div>
                              </div>
                            </div>
                            {/* Subtle gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Sales Analytics */}
                    {feature.mockup.chart && (
                      <div className="relative space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                          {feature.mockup.metrics?.map((metric, metricIndex) => (
                            <motion.div
                              key={metricIndex}
                              initial={{ scale: 0.8, opacity: 0 }}
                              whileInView={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.5 + metricIndex * 0.1 }}
                              viewport={{ once: true }}
                              className="group relative text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300"
                            >
                              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                              <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                                metric.change.startsWith('+') ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-100'
                              }`}>
                                {metric.change}
                              </div>
                              {/* Subtle gradient overlay */}
                              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Chart visualization */}
                        <div className="h-32 rounded-xl bg-gray-50 p-4 flex items-end space-x-1 overflow-hidden relative">
                          <div className="absolute top-2 left-4 text-xs text-gray-500 font-medium">Sales Trend</div>
                          {[20, 35, 45, 30, 50, 40, 60, 45, 55].map((height, chartIndex) => (
                            <motion.div
                              key={chartIndex}
                              initial={{ height: 0 }}
                              whileInView={{ height: `${height}%` }}
                              transition={{ duration: 0.5, delay: 0.8 + chartIndex * 0.1 }}
                              viewport={{ once: true }}
                              className={`flex-1 rounded-t-md bg-gradient-to-t ${feature.gradient} shadow-sm relative overflow-hidden`}
                            >
                              <div className="absolute inset-0 bg-white/20 rounded-t-md animate-pulse" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vendor Dashboard */}
                    {feature.mockup.vendors && (
                      <div className="relative space-y-3">
                        {feature.mockup.vendors.map((vendor, vendorIndex) => (
                          <motion.div
                            key={vendorIndex}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + vendorIndex * 0.1 }}
                            viewport={{ once: true }}
                            className="group relative overflow-hidden"
                          >
                            <div className="p-4 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-all duration-300 relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                                  <span className="font-medium text-gray-900">{vendor.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{vendor.utilization}%</div>
                                  <div className="text-xs text-gray-500">utilized</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                <span className="font-medium">{vendor.spend}</span>
                                <span className="text-gray-400">of {vendor.budget}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${vendor.utilization}%` }}
                                  transition={{ duration: 0.8, delay: 0.7 + vendorIndex * 0.1 }}
                                  viewport={{ once: true }}
                                  className={`h-3 rounded-full bg-gradient-to-r ${feature.gradient} shadow-sm relative overflow-hidden`}
                                >
                                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                                </motion.div>
                              </div>
                            </div>
                            {/* Subtle gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Floating decoration */}
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className={`absolute -top-8 -right-8 w-16 h-16 rounded-full bg-gradient-to-br ${feature.gradient} opacity-20 blur-xl`}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}