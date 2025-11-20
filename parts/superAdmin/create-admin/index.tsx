"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase, adminSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSendMail } from "@/services/mail";

const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
};

const createAdminSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .min(7, "Phone number must be at least 7 digits")
      .regex(/^\+?[\d\s-]{7,}$/, "Invalid phone number format")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

function LoadingSpinner() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  );
}

export default function AdminManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  // Check auth + fetch admins
  useEffect(() => {
    const checkAuthAndFetchAdmins = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          toast.error("Authentication error");
          router.push("/login");
          return;
        }

        if (user.user_metadata.role !== ROLES.SUPER_ADMIN) {
          toast.error("Super admin access required");
          router.push("/dashboard");
          return;
        }

        const { data: adminData, error: adminError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, is_active")
          .eq("role", ROLES.ADMIN);

        if (adminError) throw adminError;

        setAdmins(adminData || []);
        setIsAuthorized(true);
      } catch (error: any) {
        toast.error("Failed to load admins: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchAdmins();
  }, [router]);

  // Generate secure temporary password (fallback if not provided)
  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8) + "A1!";
  };

  const onSubmit = async (data: CreateAdminFormData) => {
    setLoading(true);
    try {
      // Re-verify super admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata.role !== ROLES.SUPER_ADMIN) {
        throw new Error("Unauthorized");
      }

      // Check if email exists
      const { data: existing } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (existing) throw new Error("Email already in use");

      // Create user
      const { data: newUser, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phoneNumber || null,
            role: ROLES.ADMIN,
          },
        },
      });

      if (authError || !newUser.user)
        throw authError || new Error("Sign up failed");

      // === SEND WELCOME EMAIL ===
      const tempPassword = data.password;
      const loginUrl = `${window.location.origin}/login`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to DiasporaBase</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; background: #f9f9fb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { max-width: 600px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); padding: 32px 24px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; color: white;}
    .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; color:white;}
    .content { padding: 32px 24px; color: #374151; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .message { font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #4b5563; }
    .credentials { background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .credential { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
    .credential:last-child { margin-bottom: 0; }
    .label { font-weight: 600; color: #1f2937; }
    .value { color: #4b5563; font-family: monospace; background: #e5e7eb; padding: 2px 8px; border-radius: 6px; font-size: 14px; }
    .btn { display: inline-block; background: #0369A1; color: white; font-weight: 600; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3); }
    .btn:hover { background: #1e40af; }
    .footer { background: #f3f4f6; padding: 24px; text-align: center; font-size: 14px; color: #6b7280; }
    .footer a { color: #1a56db; text-decoration: none; }
    @media (max-width: 480px) {
      .container { margin: 16px; border-radius: 12px; }
      .header { padding: 24px 16px; }
      .header h1 { font-size: 24px; }
      .content { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>DiasporaBase</h1>
      <p>Admin Account Created</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">Hi ${data.fullName},</div>
      <div class="message">
        Welcome! You've been added as an <strong>Administrator</strong> on <strong>DiasporaBase</strong>.
        Use the credentials below to log in and manage the platform.
      </div>

      <!-- Credentials -->
      <div class="credentials">
        <div class="credential">
          <span class="label">Email</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="credential">
          <span class="label">Password</span>
          <span class="value">${tempPassword}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn">Login to Dashboard</a>
      </div>

      <div class="message" style="font-size: 14px; color: #6b7280; margin-top: 24px;">
        <strong>Security Tip:</strong> Change your password immediately after logging in.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Need help? <a href="mailto:support@diasporabase.com">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

      await useSendMail({
        to: data.email,
        subject: "Your Admin Account – DiasporaBase",
        html,
        onSuccess: () => {
          toast.success(`Admin created and email sent to ${data.email}`);
        },
        onError: (error) => {
          toast.error(`Admin created but email failed: ${error}`);
          console.error("Email error:", error);
        },
      });

      // Update UI
      setAdmins((prev) => [
        ...prev,
        {
          id: newUser.user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phoneNumber || null,
          is_active: true,
        },
      ]);

      setOpen(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthorized) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="action-btn">Create New Admin</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label>Phone Number (Optional)</Label>
                <Input
                  {...register("phoneNumber")}
                  placeholder="+2348012345678"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="w-full action-btn"
              >
                {loading ? "Creating..." : "Create Admin"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow
                  key={admin.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.replace(`dashboard/super_admin/admins/${admin.id}`)}
                >
                  <TableCell>{admin.full_name || "N/A"}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.phone || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {admin.is_active ? "Active" : "Disabled"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
