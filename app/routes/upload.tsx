import { motion } from "framer-motion";
import { Upload, Package, Ticket, Shield, Zap, TrendingUp, CheckCircle } from "lucide-react";
import MerchUpload from '~/components/upload/MerchUpload'
import TicketUpload from '~/components/upload/TicketUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PageAccessGuard } from "~/components/access/PageAccessGuard";

export default function UploadPage() {
    return (
        <PageAccessGuard pagePath="/upload">
        <div className="p-4 sm:p-6 space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Upload className="h-4 w-4" />
                    Data Import Center
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-4 glow-text">
                    Upload Your Business Data
                </h1>
                <p className="text-lg text-muted-foreground">
                    Import your CSV files to unlock powerful insights and optimization for your franchise
                </p>
            </motion.div>

            {/* Main Upload Section */}
            <div className="max-w-5xl mx-auto">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Merchandise Upload */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="group"
                    >
                        <Card className="h-full glow-card card-shadow hover:shadow-2xl hover:shadow-primary/25 transition-all duration-500 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 p-4 transition-all duration-500 group-hover:scale-110">
                                            <Package className="h-8 w-8 text-primary transition-transform duration-500 group-hover:rotate-12" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl text-foreground group-hover:text-primary transition-colors duration-300">
                                                Inventory Data
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground mt-1">
                                                Import product inventory and stock levels
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        CSV Only
                                    </Badge>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Stock levels
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Product info
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Vendor data
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <MerchUpload />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Ticket Upload */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="group"
                    >
                        <Card className="h-full glow-card card-shadow hover:shadow-2xl hover:shadow-accent/25 transition-all duration-500 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 group-hover:from-accent/30 group-hover:to-accent/20 p-4 transition-all duration-500 group-hover:scale-110">
                                            <Ticket className="h-8 w-8 text-accent transition-transform duration-500 group-hover:rotate-12" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl text-foreground group-hover:text-accent transition-colors duration-300">
                                                Sales Data
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground mt-1">
                                                Upload transaction and performance data
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        CSV Only
                                    </Badge>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Sales transactions
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Rep performance
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Store metrics
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <TicketUpload />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Benefits Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="mt-12"
                >
                    <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                        <CardContent className="pt-8 pb-8">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    Why Choose CSV?
                                </h3>
                                <p className="text-muted-foreground">
                                    We support CSV files for maximum compatibility and reliability
                                </p>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center group">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-50 group-hover:from-green-200 group-hover:to-green-100 transition-all duration-300 mb-4">
                                        <Shield className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h4 className="font-medium text-foreground mb-2">Universal Format</h4>
                                    <p className="text-sm text-muted-foreground">
                                        CSV files work with any system and never get corrupted
                                    </p>
                                </div>
                                
                                <div className="text-center group">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300 mb-4">
                                        <Zap className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-medium text-foreground mb-2">Lightning Fast</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Quick processing and instant data validation
                                    </p>
                                </div>
                                
                                <div className="text-center group">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300 mb-4">
                                        <TrendingUp className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <h4 className="font-medium text-foreground mb-2">Instant Insights</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Get powerful analytics as soon as your data uploads
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/50">
                                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50" />
                                        <span>Bank-level security</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full shadow-sm shadow-primary/50" />
                                        <span>Auto-processing</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-accent rounded-full shadow-sm shadow-accent/50" />
                                        <span>Real-time validation</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
        </PageAccessGuard>
    )
}