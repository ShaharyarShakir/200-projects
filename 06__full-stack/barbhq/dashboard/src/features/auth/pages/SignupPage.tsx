import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../use-auth";
import { signupSchema, type SignupFormValues } from "../schemas/signup.schema";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../../components/ui/card";
import { Building2, User, Mail, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";

export const SignupPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      shopName: "",
      ownerFirstName: "",
      ownerLastName: "",
      ownerEmail: "",
      ownerPassword: "",
      phone: "",
      agreeTerms: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      await registerUser({
        shopName: values.shopName,
        ownerFirstName: values.ownerFirstName,
        ownerLastName: values.ownerLastName,
        ownerEmail: values.ownerEmail,
        ownerPassword: values.ownerPassword,
        phone: values.phone,
      });

      navigate({ to: "/dashboard" });
    } catch (err: any) {
      // Toast notice error handled in AuthProvider
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-border/80 select-none bg-card/85 backdrop-blur-xl" isGlass>
      <CardHeader className="pb-3 text-center relative">
        <Link
          to="/"
          className="absolute left-0 top-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-amber-400 to-amber-200 bg-clip-text text-transparent">
          Start Your Free Shop Trial
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Create your BarbHQ owner account & shop workspace in seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Shop Information */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Barber Shop Name
            </label>
            <Input
              placeholder="e.g. Vintage Cuts & Co."
              error={errors.shopName?.message}
              disabled={isLoading}
              {...register("shopName")}
            />
          </div>

          {/* Owner Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                First Name
              </label>
              <Input
                placeholder="John"
                error={errors.ownerFirstName?.message}
                disabled={isLoading}
                {...register("ownerFirstName")}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/90">Last Name</label>
              <Input
                placeholder="Doe"
                error={errors.ownerLastName?.message}
                disabled={isLoading}
                {...register("ownerLastName")}
              />
            </div>
          </div>

          {/* Owner Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Work Email
              </label>
              <Input
                type="email"
                placeholder="owner@barbershop.com"
                error={errors.ownerEmail?.message}
                disabled={isLoading}
                {...register("ownerEmail")}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                Phone Number
              </label>
              <Input
                placeholder="+1 (555) 000-0000"
                error={errors.phone?.message}
                disabled={isLoading}
                {...register("phone")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <PasswordInput
              label="Account Password"
              placeholder="Min. 6 characters"
              error={errors.ownerPassword?.message}
              disabled={isLoading}
              {...register("ownerPassword")}
            />
          </div>

          {/* Terms checkbox */}
          <div className="py-1">
            <label className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <input
                type="checkbox"
                disabled={isLoading}
                className="mt-0.5 rounded bg-card border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                {...register("agreeTerms")}
              />
              <span>
                I agree to the <span className="text-primary underline">Terms of Service</span> &{" "}
                <span className="text-primary underline">Privacy Policy</span>.
              </span>
            </label>
            {errors.agreeTerms?.message && (
              <p className="text-[11px] text-destructive mt-1 font-medium">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>

          {/* Value callouts */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>14-day full feature trial. No credit card required.</span>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/25" isLoading={isLoading}>
              Create My Barber Workspace
            </Button>
          </div>

          {/* Sign In link */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            Already have a shop account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In to Console
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
