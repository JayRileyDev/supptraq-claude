import { useUser } from "@clerk/react-router";
import { motion } from "framer-motion";
import { User, Palette, Bell, Globe, Shield, Save, Mail, Phone } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ThemeToggle } from "~/components/ui/theme-toggle";

import { useTheme } from "~/lib/theme-provider";
import SubscriptionStatus from "~/components/subscription-status";

function SettingsCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  delay = 0 
}: {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
              <Icon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors duration-300" />
            </div>
            <div>
              <CardTitle className="text-foreground">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen page-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and application preferences
        </p>
      </motion.div>

      <div className="max-w-4xl space-y-6">
        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SubscriptionStatus />
        </motion.div>

        {/* Profile Settings */}
        <SettingsCard
          title="Profile Information"
          description="Update your personal information and contact details"
          icon={User}
          delay={0.1}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-foreground">First Name</Label>
              <Input 
                id="firstName" 
                defaultValue={user?.firstName || ""} 
                placeholder="First name" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
              <Input 
                id="lastName" 
                defaultValue={user?.lastName || ""} 
                placeholder="Last name" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user?.primaryEmailAddress?.emailAddress || ""} 
                  placeholder="your@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg shadow-primary/25">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </SettingsCard>

        {/* Theme & Appearance */}
        <SettingsCard
          title="Theme & Appearance"
          description="Customize how SuppTraq looks and feels"
          icon={Palette}
          delay={0.2}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Theme Preference</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground capitalize">
                  {theme}
                </span>
                <ThemeToggle />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use smaller spacing and elements
                </p>
              </div>
              <Switch />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-foreground">Currency Display</Label>
              <Select defaultValue="usd">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                  <SelectItem value="cad">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          title="Notifications"
          description="Control what notifications you receive and how"
          icon={Bell}
          delay={0.3}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about account activity and updates
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when inventory runs low
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Sales Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly sales performance summaries
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Transfer Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Updates on inter-store transfers
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </SettingsCard>

        {/* Regional Settings */}
        <SettingsCard
          title="Regional Settings"
          description="Configure timezone, language, and regional preferences"
          icon={Globe}
          delay={0.4}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
              <Select defaultValue="america/new_york">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america/new_york">Eastern Time (ET)</SelectItem>
                  <SelectItem value="america/chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="america/denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="america/los_angeles">Pacific Time (PT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language" className="text-foreground">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="text-foreground">Date Format</Label>
              <Select defaultValue="mm/dd/yyyy">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="units" className="text-foreground">Measurement Units</Label>
              <Select defaultValue="imperial">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imperial">Imperial (lb, oz)</SelectItem>
                  <SelectItem value="metric">Metric (kg, g)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsCard>

        {/* Security */}
        <SettingsCard
          title="Security & Privacy"
          description="Manage your account security and privacy settings"
          icon={Shield}
          delay={0.5}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out after inactivity
                </p>
              </div>
              <Select defaultValue="30">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Data Export</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your data
                </p>
              </div>
              <Button variant="outline" size="sm">
                Request Export
              </Button>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
