// Removed unused imports - handled by dashboard layout
import { motion } from "framer-motion";
import { Upload, Package, Ticket, FileSpreadsheet } from "lucide-react";
import MerchUpload from '~/components/upload/MerchUpload'
import TicketUpload from '~/components/upload/TicketUpload'
import SkuVendorMapUpload from '~/components/upload/SkuVendorMapUpload'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
// Loader removed - authentication and subscription checks handled by dashboard layout

export default function UploadPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
                    Upload Your Data
                </h1>
                <p className="text-muted-foreground">
                    Import your merchandise and ticket data to get started with Supptraq
                </p>
            </motion.div>

            {/* Upload Cards */}
            <div className="max-w-4xl mx-auto">
                <div className="grid gap-8 md:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="group"
                    >
                        <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 p-3 transition-all duration-300">
                                        <Package className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors duration-300" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-foreground">Merchandise Data</CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            Import inventory levels and product information
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <MerchUpload />
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="group"
                    >
                        <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-gradient-to-br from-accent/10 to-primary/10 group-hover:from-accent/20 group-hover:to-primary/20 p-3 transition-all duration-300">
                                        <Ticket className="h-6 w-6 text-accent group-hover:text-accent/80 transition-colors duration-300" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-foreground">Ticket Data</CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            Upload sales transactions and performance data
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TicketUpload />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* SKU Vendor Map Upload - Small Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-6"
                >
                    <div className="max-w-md mx-auto">
                        <Card className="border-dashed border-2 border-blue-300 bg-blue-50/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                    <CardTitle className="text-sm text-blue-800">SKU Vendor Map</CardTitle>
                                </div>
                                <CardDescription className="text-xs text-blue-600">
                                    Quick restore for item descriptions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <SkuVendorMapUpload />
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* Help Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-8"
                >
                    <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 text-muted-foreground">
                                    <Upload className="h-5 w-5 text-primary" />
                                    <p className="text-sm font-medium">
                                        Supported file formats: CSV, Excel (.xlsx, .xls)
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50" />
                                        <span>Secure upload</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-primary rounded-full shadow-sm shadow-primary/50" />
                                        <span>Auto-processing</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-accent rounded-full shadow-sm shadow-accent/50" />
                                        <span>Real-time updates</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <p className="text-xs text-muted-foreground">
                                        Need help formatting your data? 
                                        <Button variant="link" className="h-auto p-0 ml-1 text-xs text-primary hover:text-primary/80">
                                            Download templates
                                        </Button>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}