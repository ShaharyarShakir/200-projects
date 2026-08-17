import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../use-auth";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
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
import { ArrowLeft } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const savedEmail = localStorage.getItem("barbhq_remembered_email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail,
      password: "",
      rememberMe: !!savedEmail,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login({
        email: values.email,
        password: values.password,
      });

      if (values.rememberMe) {
        localStorage.setItem("barbhq_remembered_email", values.email);
      } else {
        localStorage.removeItem("barbhq_remembered_email");
      }

      navigate({ to: "/dashboard" });
    } catch (err: any) {
      // Toast already shown in AuthProvider
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-border/80 select-none bg-card/85 backdrop-blur-xl" isGlass>
      <CardHeader className="pb-4 text-center relative">
        <Link
          to="/"
          className="absolute left-0 top-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-amber-400 to-amber-200 bg-clip-text text-transparent">
          Console Sign In
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Enter credentials to connect to your BarbHQ shop workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. owner@barbershop.com"
            error={errors.email?.message}
            disabled={isLoading}
            {...register("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isLoading}
            {...register("password")}
          />

          <div className="flex justify-between items-center py-1 text-xs">
            <label className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <input
                type="checkbox"
                disabled={isLoading}
                className="bg-card border-border rounded focus:outline-none focus:ring-primary w-4 h-4 text-primary cursor-pointer"
                {...register("rememberMe")}
              />
              Remember my email
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/25" isLoading={isLoading}>
              Sign In to Console
            </Button>
          </div>

          <div className="text-center pt-3 text-xs text-muted-foreground">
            Don&apos;t have a shop account yet?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create New Account & Shop
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

