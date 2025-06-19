import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Wifi, 
  Key, 
  Home,
  User,
  Mail,
  Shield,
  Save,
  Edit,
  Building,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
// import { useToast } from "~/hooks/use-toast";

export default function OperationalInfo() {
  const storeProfile = useQuery(api.storeProfiles.getStoreProfile);
  const updateProfile = useMutation(api.storeProfiles.upsertStoreProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    wifi: false,
    pos: false,
    lockbox: false
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    store_name: "",
    address: "",
    phone: "",
    wifi_password: "",
    lockbox_code: "",
    landlord_name: "",
    landlord_phone: "",
    landlord_email: "",
    store_lead: "",
    district_manager: "",
    regional_manager: "",
    pos_credentials: {
      username: "",
      password: "",
      notes: ""
    }
  });

  useEffect(() => {
    if (storeProfile) {
      setFormData({
        store_name: storeProfile.store_name || "",
        address: storeProfile.address || "",
        phone: storeProfile.phone || "",
        wifi_password: storeProfile.wifi_password || "",
        lockbox_code: storeProfile.lockbox_code || "",
        landlord_name: storeProfile.landlord_name || "",
        landlord_phone: storeProfile.landlord_phone || "",
        landlord_email: storeProfile.landlord_email || "",
        store_lead: storeProfile.store_lead || "",
        district_manager: storeProfile.district_manager || "",
        regional_manager: storeProfile.regional_manager || "",
        pos_credentials: {
          username: storeProfile.pos_credentials?.username || "",
          password: storeProfile.pos_credentials?.password || "",
          notes: storeProfile.pos_credentials?.notes || ""
        }
      });
    }
  }, [storeProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      // Success toast would go here
    } catch (error) {
      console.error("Failed to update store information:", error);
      // Error toast would go here
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Success toast would go here
  };

  const InfoSection = ({ icon: Icon, title, children, className = "" }: any) => (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4 pl-12">{children}</div>
    </div>
  );

  const InfoField = ({ label, value, type = "text", field, isSecret = false, copyable = false }: any) => {
    const fieldValue = field.includes(".")
      ? field.split(".").reduce((obj: any, key: string) => obj[key], formData)
      : formData[field as keyof typeof formData];

    if (!isEditing) {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex-1 p-3 rounded-lg border bg-muted/30",
              !value && "text-muted-foreground"
            )}>
              {isSecret ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    {showPasswords[field as keyof typeof showPasswords] ? value || "Not set" : "••••••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswords(prev => ({
                      ...prev,
                      [field]: !prev[field as keyof typeof showPasswords]
                    }))}
                    className="h-6 w-6 p-0"
                  >
                    {showPasswords[field as keyof typeof showPasswords] ? 
                      <EyeOff className="h-3 w-3" /> : 
                      <Eye className="h-3 w-3" />
                    }
                  </Button>
                </div>
              ) : (
                value || "Not set"
              )}
            </div>
            {copyable && value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(value, label)}
                className="h-9 w-9 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    const inputProps = {
      value: fieldValue,
      onChange: (e: any) => {
        if (field.includes(".")) {
          const keys = field.split(".");
          setFormData((prev) => ({
            ...prev,
            [keys[0]]: {
              ...prev[keys[0] as keyof typeof formData] as any,
              [keys[1]]: e.target.value,
            },
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [field]: e.target.value,
          }));
        }
      },
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="text-sm font-medium text-foreground">{label}</Label>
        {type === "textarea" ? (
          <Textarea 
            id={field} 
            className="min-h-[100px] resize-none" 
            placeholder={`Enter ${label.toLowerCase()}...`}
            {...inputProps} 
          />
        ) : (
          <Input 
            id={field} 
            type={isSecret && !showPasswords[field as keyof typeof showPasswords] ? "password" : type}
            placeholder={`Enter ${label.toLowerCase()}...`}
            {...inputProps} 
          />
        )}
      </div>
    );
  };

  const completionStatus = () => {
    const fields = [
      formData.store_name,
      formData.address,
      formData.phone,
      formData.wifi_password,
      formData.lockbox_code,
      formData.store_lead
    ];
    const completed = fields.filter(field => field && field.trim()).length;
    return { completed, total: fields.length, percentage: Math.round((completed / fields.length) * 100) };
  };

  const status = completionStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Store Information</h1>
          <p className="text-muted-foreground">
            Essential operational details and contact information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant={status.percentage >= 80 ? "default" : "secondary"}
            className={cn(
              "text-xs",
              status.percentage >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : ""
            )}
          >
            {status.percentage >= 80 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            {status.completed}/{status.total} Complete
          </Badge>
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            variant={isEditing ? "default" : "outline"}
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              "Saving..."
            ) : isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Info
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {!isEditing && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Profile Completion</span>
                  <span className="text-sm text-muted-foreground">{status.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      status.percentage >= 80 ? "bg-emerald-500" : "bg-primary"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
              {status.percentage < 100 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="text-primary hover:text-primary"
                >
                  Complete Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Store Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Store Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <InfoField
              label="Store Name"
              value={formData.store_name}
              field="store_name"
            />
            <InfoField
              label="Store Address"
              value={formData.address}
              field="address"
              type="textarea"
            />
            <InfoField
              label="Store Phone"
              value={formData.phone}
              field="phone"
              type="tel"
              copyable={true}
            />
          </CardContent>
        </Card>

        {/* Access & Security */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Access & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <InfoField
              label="Wi-Fi Password"
              value={formData.wifi_password}
              field="wifi"
              isSecret={true}
              copyable={true}
            />
            <InfoField
              label="Lock Box Code"
              value={formData.lockbox_code}
              field="lockbox"
              isSecret={true}
              copyable={true}
            />
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                POS System Credentials
              </h4>
              <InfoField
                label="Username"
                value={formData.pos_credentials.username}
                field="pos_credentials.username"
                copyable={true}
              />
              <InfoField
                label="Password"
                value={formData.pos_credentials.password}
                field="pos"
                isSecret={true}
                copyable={true}
              />
              <InfoField
                label="Additional Notes"
                value={formData.pos_credentials.notes}
                field="pos_credentials.notes"
                type="textarea"
              />
            </div>
          </CardContent>
        </Card>

        {/* Management Team */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Management Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <InfoField
              label="Store Lead"
              value={formData.store_lead}
              field="store_lead"
            />
            <InfoField
              label="District Manager"
              value={formData.district_manager}
              field="district_manager"
            />
            <InfoField
              label="Regional Manager"
              value={formData.regional_manager}
              field="regional_manager"
            />
          </CardContent>
        </Card>

        {/* Landlord Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Landlord Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <InfoField
              label="Landlord Name"
              value={formData.landlord_name}
              field="landlord_name"
            />
            <InfoField
              label="Phone Number"
              value={formData.landlord_phone}
              field="landlord_phone"
              type="tel"
              copyable={true}
            />
            <InfoField
              label="Email Address"
              value={formData.landlord_email}
              field="landlord_email"
              type="email"
              copyable={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons when editing */}
      {isEditing && (
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Make sure all information is accurate before saving.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to original values
                    if (storeProfile) {
                      setFormData({
                        store_name: storeProfile.store_name || "",
                        address: storeProfile.address || "",
                        phone: storeProfile.phone || "",
                        wifi_password: storeProfile.wifi_password || "",
                        lockbox_code: storeProfile.lockbox_code || "",
                        landlord_name: storeProfile.landlord_name || "",
                        landlord_phone: storeProfile.landlord_phone || "",
                        landlord_email: storeProfile.landlord_email || "",
                        store_lead: storeProfile.store_lead || "",
                        district_manager: storeProfile.district_manager || "",
                        regional_manager: storeProfile.regional_manager || "",
                        pos_credentials: {
                          username: storeProfile.pos_credentials?.username || "",
                          password: storeProfile.pos_credentials?.password || "",
                          notes: storeProfile.pos_credentials?.notes || ""
                        }
                      });
                    }
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}