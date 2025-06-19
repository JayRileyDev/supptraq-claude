import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
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
  Edit
} from "lucide-react";

export default function OperationalInfo() {
  const storeProfile = useQuery(api.storeProfiles.getStoreProfile);
  const updateProfile = useMutation(api.storeProfiles.upsertStoreProfile);
  const [isEditing, setIsEditing] = useState(false);
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
    try {
      await updateProfile(formData);
      setIsEditing(false);
      // Success - in a real app, you'd show a toast notification
      console.log("Store information updated successfully");
    } catch (error) {
      console.error("Failed to update store information:", error);
    }
  };

  const InfoSection = ({ icon: Icon, title, children }: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5" />
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const InfoField = ({ label, value, type = "text", field }: any) => {
    if (!isEditing) {
      return (
        <div>
          <Label className="text-sm text-gray-500">{label}</Label>
          <p className="mt-1">{value || "-"}</p>
        </div>
      );
    }

    const inputProps = {
      value: field.includes(".")
        ? field.split(".").reduce((obj: any, key: string) => obj[key], formData)
        : formData[field as keyof typeof formData],
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
      <div>
        <Label htmlFor={field}>{label}</Label>
        {type === "textarea" ? (
          <Textarea id={field} className="mt-1" {...inputProps} />
        ) : (
          <Input id={field} type={type} className="mt-1" {...inputProps} />
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operational Information</h1>
          <p className="mt-2 text-gray-600">
            Essential store information and contact details
          </p>
        </div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Information
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Store Details */}
        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoSection icon={MapPin} title="Location">
              <InfoField
                label="Store Name"
                value={formData.store_name}
                field="store_name"
              />
              <InfoField
                label="Address"
                value={formData.address}
                field="address"
                type="textarea"
              />
              <InfoField
                label="Phone"
                value={formData.phone}
                field="phone"
                type="tel"
              />
            </InfoSection>
          </CardContent>
        </Card>

        {/* Access Information */}
        <Card>
          <CardHeader>
            <CardTitle>Access Information</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoSection icon={Key} title="Security">
              <InfoField
                label="Wi-Fi Password"
                value={formData.wifi_password}
                field="wifi_password"
              />
              <InfoField
                label="Lock Box Code"
                value={formData.lockbox_code}
                field="lockbox_code"
              />
            </InfoSection>

            <div className="mt-6">
              <InfoSection icon={Shield} title="POS System">
                <InfoField
                  label="Username"
                  value={formData.pos_credentials.username}
                  field="pos_credentials.username"
                />
                <InfoField
                  label="Password"
                  value={formData.pos_credentials.password}
                  field="pos_credentials.password"
                  type="password"
                />
                <InfoField
                  label="Notes"
                  value={formData.pos_credentials.notes}
                  field="pos_credentials.notes"
                  type="textarea"
                />
              </InfoSection>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoSection icon={Home} title="Landlord">
              <InfoField
                label="Name"
                value={formData.landlord_name}
                field="landlord_name"
              />
              <InfoField
                label="Phone"
                value={formData.landlord_phone}
                field="landlord_phone"
                type="tel"
              />
              <InfoField
                label="Email"
                value={formData.landlord_email}
                field="landlord_email"
                type="email"
              />
            </InfoSection>
          </CardContent>
        </Card>

        {/* Management Team */}
        <Card>
          <CardHeader>
            <CardTitle>Management Team</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoSection icon={User} title="Team">
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
            </InfoSection>
          </CardContent>
        </Card>
      </div>

      {/* Cancel button when editing */}
      {isEditing && (
        <div className="mt-6 flex justify-end">
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
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}