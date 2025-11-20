// app/super_admin/admins/[id]/AdminDetailsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, X, User, Mail, Phone, Calendar, Edit3 } from "lucide-react";
import { format } from "date-fns";

type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminDetailsClient({ initialAdmin }: { initialAdmin: AdminProfile }) {
  const [admin, setAdmin] = useState<AdminProfile>(initialAdmin);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialAdmin.full_name || "",
    phone: initialAdmin.phone || "",
    email: initialAdmin.email,
  });

  const supabase = createClient();

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", admin.id);

      if (error) throw error;

      setAdmin(prev => ({
        ...prev,
        full_name: formData.full_name,
        phone: formData.phone || null,
      }));
      setEditing(false);
      toast.success("Admin details updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update admin");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: admin.full_name || "",
      phone: admin.phone || "",
      email: admin.email,
    });
    setEditing(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600" />
          Admin Details
        </h1>
        <p className="text-muted-foreground mt-2">View and edit admin account information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-blue-100">
              <AvatarImage src={admin.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {admin.full_name?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{admin.full_name || "Unnamed Admin"}</CardTitle>
            <Badge variant="secondary" className="mt-2 w-fit mx-auto">
              {admin.role.replace("_", " ").toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{admin.email}</span>
            </div>
            {admin.phone && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{admin.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {format(new Date(admin.created_at), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Editable Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update admin personal details</CardDescription>
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  disabled={!editing}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editing}
                  placeholder="+234 801 234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center h-10 px-3 rounded-md bg-muted text-muted-foreground">
                  {admin.role.replace("_", " ").toUpperCase()}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>User ID:</strong> {admin.id}</p>
                <p><strong>Last Updated:</strong> {format(new Date(admin.updated_at), "PPP 'at' p")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}