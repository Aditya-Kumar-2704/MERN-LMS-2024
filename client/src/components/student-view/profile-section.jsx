import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/context/auth-context";
import {
  profileImageUploadService,
  updateUserProfileService,
} from "@/services";
import { Camera, IdCard, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useContext, useEffect, useState } from "react";

function getProfileFormState(user) {
  return {
    userName: user?.userName || "",
    rollNumber: user?.rollNumber || "",
    phoneNumber: user?.phoneNumber || "",
    address: user?.address || "",
    about: user?.about || "",
    profileImage: user?.profileImage || "",
    profileImagePublicId: user?.profileImagePublicId || "",
  };
}

function getInitials(value) {
  const initials = String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || "ST";
}

function StudentProfileSection() {
  const { auth, syncAuthSession } = useContext(AuthContext);
  const [formData, setFormData] = useState(() => getProfileFormState(auth?.user));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFormData(getProfileFormState(auth?.user));
  }, [auth?.user]);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleProfileImageUpload(file) {
    if (!file) return;

    try {
      setUploading(true);
      const response = await profileImageUploadService(file);

      if (response?.success) {
        setFormData((current) => ({
          ...current,
          profileImage: response.data.url,
          profileImagePublicId: response.data.public_id,
        }));
      } else {
        alert(response?.message || "Could not upload profile image");
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      alert("Could not upload profile image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    try {
      setSaving(true);
      const response = await updateUserProfileService(formData);

      if (response?.success) {
        syncAuthSession(response.data.user, response.data.accessToken);
        alert(response.message || "Profile updated successfully");
      } else {
        alert(response?.message || "Could not update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert(error?.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">Student Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center text-center">
            {formData.profileImage ? (
              <img
                src={formData.profileImage}
                alt={formData.userName || "Student profile"}
                className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow-sm">
                {getInitials(formData.userName)}
              </div>
            )}

            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {formData.userName || "Student"}
            </h3>
            <p className="text-sm text-slate-500">{auth?.user?.role || "user"}</p>
          </div>

          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>{auth?.user?.userEmail || "No email"}</span>
            </div>
            <div className="flex items-center gap-3">
              <IdCard className="h-4 w-4 text-blue-600" />
              <span>{formData.rollNumber || "Roll number not added"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-600" />
              <span>{formData.phoneNumber || "Phone number not added"}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
              <span>{formData.address || "Address not added"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSaveProfile}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-user-name">Student Name</Label>
                <Input
                  id="profile-user-name"
                  value={formData.userName}
                  onChange={(event) => updateField("userName", event.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={auth?.user?.userEmail || ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-roll-number">Roll Number</Label>
                <Input
                  id="profile-roll-number"
                  value={formData.rollNumber}
                  onChange={(event) => updateField("rollNumber", event.target.value)}
                  placeholder="Enter your roll number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone-number">Phone Number</Label>
                <Input
                  id="profile-phone-number"
                  value={formData.phoneNumber}
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-address">Address</Label>
              <Input
                id="profile-address"
                value={formData.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Enter your address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-about">About</Label>
              <Textarea
                id="profile-about"
                value={formData.about}
                onChange={(event) => updateField("about", event.target.value)}
                placeholder="Write a short introduction about yourself"
                rows={5}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 p-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-slate-900">Profile Image</p>
              </div>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => handleProfileImageUpload(event.target.files?.[0])}
              />
              <p className="text-sm text-slate-500">
                {uploading
                  ? "Uploading image..."
                  : "Upload a profile photo for your student dashboard."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(getProfileFormState(auth?.user))}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentProfileSection;
