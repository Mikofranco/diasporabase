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
import { toast } from "@/components/ui/use-toast";
import { supabase, adminSupabase } from "@/lib/supabase/client";

// Role constants
const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
};

// Zod schema for form validation
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

// Modern Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex flex-col items-center space-y-4 animate-fadeIn">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-t-blue-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin-slow"></div>
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200 animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default function AdminManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  useEffect(() => {
    const checkAuthAndFetchAdmins = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in to access this page.",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const userRole = user.user_metadata.role;
        if (userRole !== ROLES.SUPER_ADMIN) {
          toast({
            title: "Authorization Error",
            description: "You must be a super admin to access this page.",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        const { data: adminData, error: adminError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, is_active")
          .eq("role", ROLES.ADMIN);

        if (adminError) {
          throw new Error(`Failed to fetch admins: ${adminError.message}`);
        }

        setAdmins(adminData || []);
        setIsAuthorized(true);
      } catch (error) {
        toast({
          title: "Error",
          description://@ts-ignore
            error.message ||
            "An unexpected error occurred while loading the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchAdmins();
  }, [router]);

  const onSubmit = async (data: CreateAdminFormData) => {
    setLoading(true);
    try {
      // Verify super admin role
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user || user.user_metadata.role !== ROLES.SUPER_ADMIN) {
        throw new Error("Unauthorized: Super admin access required");
      }

      // Check if user already exists
      const { data: existingUser, error: userCheckError } = await adminSupabase
        .from("Users")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (userCheckError) {
        throw new Error(
          `Error checking existing user: ${userCheckError.message}`
        );
      }
      if (existingUser) {
        throw new Error("A user with this email already exists.");
      }

      // Create new admin user
      const { data: newUser, error: authError } =
        await adminSupabase.auth.signUp({
          full_name: data.fullName,
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

      if (authError || !newUser.user) {
        throw new Error(authError?.message || "Failed to create admin user");
      }

      // Upsert profile to avoid duplicate key error
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: newUser.user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phoneNumber || null,
          role: ROLES.ADMIN,
          is_active: true,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        throw new Error(`Profile upsert error: ${profileError.message}`);
      }

      //@ts-ignore
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

      toast({
        title: "Success",
        description: "Admin user created successfully.",
      });
      setOpen(false);
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description://@ts-ignore
          error.message || "An error occurred while creating the admin user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthorized) {
    return <LoadingSpinner />;
  }

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
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="+1234567890"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
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
                {loading || isSubmitting ? "Creating Admin..." : "Create Admin"}
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
              <TableHead>Phone Number</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow
                  key={admin.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/super-admin/admins/${admin.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/super-admin/admins/${admin.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"//@ts-ignore
                  aria-label={`View details for ${admin.full_name || "admin"}`}
                >
                  <TableCell>{admin.full_name || "N/A"}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.phone || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
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
