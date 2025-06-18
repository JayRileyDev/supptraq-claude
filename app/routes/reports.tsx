import { motion } from "framer-motion";
import { FileText, Download, Calendar, Filter, BarChart3, TrendingUp, Package, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { PageAccessGuard } from "~/components/access/PageAccessGuard";


export default function ReportsPage() {
  return (
    <PageAccessGuard pagePath="/reports">
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Generate and export comprehensive business reports
        </p>
      </motion.div>

      {/* Coming Soon State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <Card className="w-full max-w-2xl glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center group"
              >
                <BarChart3 className="h-10 w-10 text-primary group-hover:text-primary/80 transition-colors duration-300" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h3 className="text-2xl font-bold text-foreground mb-3 glow-text">
                  Advanced Reports Coming Soon
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We're building comprehensive reporting tools to help you analyze sales performance, inventory trends, and business metrics with powerful visualizations and insights.
                </p>
              </motion.div>
              
              {/* Feature Preview Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50">
                  <FileText className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-medium text-foreground text-sm mb-1">Custom Reports</h4>
                  <p className="text-xs text-muted-foreground">Build tailored reports for your specific business needs</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50">
                  <TrendingUp className="h-6 w-6 text-accent mb-2" />
                  <h4 className="font-medium text-foreground text-sm mb-1">Advanced Analytics</h4>
                  <p className="text-xs text-muted-foreground">Deep insights with predictive trends and forecasting</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50">
                  <Download className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-medium text-foreground text-sm mb-1">Scheduled Exports</h4>
                  <p className="text-xs text-muted-foreground">Automated report delivery to your inbox</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="pt-6 border-t border-border/50"
              >
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Coming in v2.0
                </Badge>
                <p className="text-xs text-muted-foreground/70 mt-3">
                  Get notified when this feature launches by checking your dashboard regularly
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </PageAccessGuard>
  );
}
