import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../features/auth";
import {
  Scissors,
  Calendar,
  CreditCard,
  PackageCheck,
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
  BarChart3,
  Clock,
} from "lucide-react";

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [activeTab, setActiveTab] = useState<"calendar" | "pos" | "staff" | "analytics">("calendar");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-amber-500 to-amber-600 text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
              <Scissors className="h-6 w-6 -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-wider uppercase text-foreground group-hover:text-primary transition-colors">
                BarbHQ
              </span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-semibold -mt-1">
                Shop Management
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Live Preview
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Testimonials
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started Free</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-b from-background via-card/30 to-background">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-6 animate-fade-in shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Barber Shop SaaS Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Streamline Your Barber Shop.{" "}
              <span className="bg-gradient-to-r from-primary via-amber-400 to-amber-200 bg-clip-text text-transparent">
                Elevate Every Cut.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
              The complete operational OS built for modern barber shop owners. Manage appointments, POS checkout, staff commissions, stock, and client loyalty in one place.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border bg-card/60 backdrop-blur-md font-semibold text-base text-foreground hover:bg-secondary transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Console Login</span>
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant setup under 2 minutes
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel anytime
              </span>
            </div>

            {/* Stats Metric Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md shadow-xl">
              <div className="p-4 text-center border-r border-border/50 last:border-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Shops Managed</p>
              </div>
              <div className="p-4 text-center border-r border-border/50 last:border-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-primary">1.2M+</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Bookings Completed</p>
              </div>
              <div className="p-4 text-center border-r border-border/50 last:border-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">System Uptime</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
                  4.9 <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline-block" />
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Barber Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 bg-background border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-3">
                Built For Modern Barber Shops
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Everything You Need to Run Your Barber Empire
              </p>
              <p className="mt-4 text-base text-muted-foreground">
                Ditch paper schedules, fragmented tools, and manual calculations. BarbHQ unites your entire shop operations into one sleek console.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-2xl bg-card border border-border/70 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Smart Booking & Reminders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seamless client online scheduling with automated SMS/email reminders to eliminate no-shows and keep chairs filled.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-2xl bg-card border border-border/70 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Instant POS & Checkout</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fast register checkout, cash & card split payments, custom service add-ons, digital receipts, and tip tracking.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-2xl bg-card border border-border/70 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Staff Shifts & Payroll</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage barber rosters, shift attendance, chair rentals, and automated commission calculations per haircut.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group p-8 rounded-2xl bg-card border border-border/70 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Inventory & Stock Alerts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track pomades, oils, blades, and supplies. Set low-stock thresholds and send purchase orders directly to vendors.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="group p-8 rounded-2xl bg-card border border-border/70 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Client CRM & Loyalty</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Store haircut preferences, notes, photo history, and reward loyal clients with automated points & birthday perks.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="group p-8 rounded-2xl bg-card border border-border/70 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Executive Financial Insights</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time revenue reports, top-performing barbers, peak hours heatmaps, and profit margin analysis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE DEMO PREVIEW SECTION */}
        <section id="demo" className="py-20 bg-card/40 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-3">
                Console Experience
              </h2>
              <p className="text-3xl font-extrabold text-foreground">
                Designed for Speed, Elegance, and Efficiency
              </p>
            </div>

            {/* Tab navigation */}
            <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  activeTab === "calendar"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Appointment Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab("pos")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  activeTab === "pos"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>POS & Checkout</span>
              </button>

              <button
                onClick={() => setActiveTab("staff")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  activeTab === "staff"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Barber Schedules</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  activeTab === "analytics"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Revenue Analytics</span>
              </button>
            </div>

            {/* Tab Preview Box */}
            <div className="max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
              {activeTab === "calendar" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-bold">Today&apos;s Chair Schedule</h4>
                      <p className="text-xs text-muted-foreground">4 Barbers Active • 18 Appointments</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold rounded-full">
                      Live Syncing
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="flex justify-between text-xs font-semibold text-primary mb-2">
                        <span>09:00 AM</span>
                        <span>Chair 1</span>
                      </div>
                      <p className="text-sm font-bold">Fade & Beard Trim</p>
                      <p className="text-xs text-muted-foreground">Client: Alex Rivera • Barber: Marcus</p>
                      <div className="mt-3 text-xs text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="flex justify-between text-xs font-semibold text-amber-500 mb-2">
                        <span>10:30 AM</span>
                        <span>Chair 2</span>
                      </div>
                      <p className="text-sm font-bold">Executive Razor Shave</p>
                      <p className="text-xs text-muted-foreground">Client: David Chen • Barber: Sam</p>
                      <div className="mt-3 text-xs text-amber-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Upcoming
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="flex justify-between text-xs font-semibold text-primary mb-2">
                        <span>11:15 AM</span>
                        <span>Chair 3</span>
                      </div>
                      <p className="text-sm font-bold">Buzz Cut & Lineup</p>
                      <p className="text-xs text-muted-foreground">Client: Michael Vance • Barber: Leo</p>
                      <div className="mt-3 text-xs text-blue-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Confirmed via SMS
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "pos" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-bold">Express Register Terminal</h4>
                      <p className="text-xs text-muted-foreground">Order #1042 • Client: James Taylor</p>
                    </div>
                    <span className="text-xl font-extrabold text-primary">$65.00</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-3 rounded-lg bg-background border border-border">
                      <span>Signature Skin Fade</span>
                      <span className="font-semibold">$45.00</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-background border border-border">
                      <span>Matte Clay Pomade (Retail)</span>
                      <span className="font-semibold">$20.00</span>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-secondary">
                      Print Receipt
                    </button>
                    <button className="px-5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
                      Complete Checkout ($65.00)
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "staff" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-bold">Barber Rosters & Commissions</h4>
                      <p className="text-xs text-muted-foreground">Weekly Performance Breakdown</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-background border border-border flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">Marcus Vance (Master Barber)</p>
                        <p className="text-muted-foreground">42 Haircuts • $1,890 Service Rev</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-primary text-sm">$1,134.00</p>
                        <p className="text-muted-foreground text-[10px]">60% Commission</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">Leo Sterling (Barber)</p>
                        <p className="text-muted-foreground">38 Haircuts • $1,520 Service Rev</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-primary text-sm">$836.00</p>
                        <p className="text-muted-foreground text-[10px]">55% Commission</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-bold">Monthly Revenue Overview</h4>
                      <p className="text-xs text-muted-foreground">August 2026 Performance</p>
                    </div>
                    <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +24% vs Last Month
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <p className="text-xs text-muted-foreground font-medium">Total Gross</p>
                      <p className="text-xl font-bold text-foreground mt-1">$24,850</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <p className="text-xs text-muted-foreground font-medium">Retail Sales</p>
                      <p className="text-xl font-bold text-primary mt-1">$4,320</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <p className="text-xs text-muted-foreground font-medium">Avg ticket</p>
                      <p className="text-xl font-bold text-emerald-500 mt-1">$58.40</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 bg-background border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-3">
                Transparent Pricing
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground">
                Simple Plans For Every Barber Shop
              </p>
              <p className="mt-4 text-base text-muted-foreground">
                Scale as your shop grows. No hidden fees or binding contracts.
              </p>

              {/* Billing Toggle */}
              <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-card border border-border">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycle === "annual"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter */}
              <div className="p-8 rounded-2xl bg-card border border-border/70 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold">Starter Chair</h3>
                  <p className="text-xs text-muted-foreground mt-1">Ideal for solo barbers & boutique shops</p>
                  <div className="my-6">
                    <span className="text-4xl font-extrabold">
                      ${billingCycle === "annual" ? "29" : "35"}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <ul className="space-y-3 text-xs text-muted-foreground mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Up to 2 Barbers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Unlimited Bookings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Basic POS Checkout
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Email Reminders
                    </li>
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className="w-full py-3 text-center text-xs font-bold rounded-xl border border-border bg-background hover:bg-secondary transition-colors"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro (Popular) */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-b from-card to-card/90 border-2 border-primary shadow-2xl flex flex-col justify-between">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pro Studio</h3>
                  <p className="text-xs text-muted-foreground mt-1">For growing multi-chair barber shops</p>
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-primary">
                      ${billingCycle === "annual" ? "79" : "95"}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <ul className="space-y-3 text-xs text-muted-foreground mb-8">
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Up to 10 Barbers
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Full POS & Inventory Control
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Automated SMS Reminders
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Staff Commission & Payroll
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Client Loyalty Program
                    </li>
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className="w-full py-3 text-center text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-2xl bg-card border border-border/70 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold">Franchise Empire</h3>
                  <p className="text-xs text-muted-foreground mt-1">For multi-location shop networks</p>
                  <div className="my-6">
                    <span className="text-4xl font-extrabold">
                      ${billingCycle === "annual" ? "149" : "175"}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <ul className="space-y-3 text-xs text-muted-foreground mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Unlimited Barbers & Locations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Custom API & Webhooks
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Dedicated Account Manager
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Advanced Executive Analytics
                    </li>
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className="w-full py-3 text-center text-xs font-bold rounded-xl border border-border bg-background hover:bg-secondary transition-colors"
                >
                  Contact Sales / Sign Up
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-20 bg-card/40 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-3">
                Owner Feedback
              </h2>
              <p className="text-3xl font-extrabold text-foreground">
                Trusted by 500+ Barber Shops Worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic mb-6">
                  &ldquo;BarbHQ changed how we run our 6 chairs. No-shows dropped by 80% with automated SMS, and calculating barber commissions takes 5 minutes now.&rdquo;
                </p>
                <div>
                  <p className="font-bold text-sm">Dominic Rossi</p>
                  <p className="text-xs text-muted-foreground">Owner, Kingsmen Barber Co.</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic mb-6">
                  &ldquo;The POS is lighting fast, and our barbers love seeing their daily tips and earnings live on the console. Absolute game changer.&rdquo;
                </p>
                <div>
                  <p className="font-bold text-sm">Marcus Sterling</p>
                  <p className="text-xs text-muted-foreground">Founder, Sterling Grooming Lounge</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic mb-6">
                  &ldquo;Setting up our shop took under two minutes. The client haircut history notes let us give personalized service every single time.&rdquo;
                </p>
                <div>
                  <p className="font-bold text-sm">Elena Rostova</p>
                  <p className="text-xs text-muted-foreground">Head Barber, Modern Edge Studio</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="py-16 bg-gradient-to-r from-primary/20 via-amber-500/10 to-primary/20 border-t border-border/50 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Ready to Upgrade Your Barber Shop Operations?
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
              Join hundreds of top barber shop owners today. Start your 14-day free trial in seconds.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <span>Create Shop Account</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-background py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-5 w-5 -rotate-45" />
            </div>
            <div>
              <p className="font-serif text-base font-bold text-foreground uppercase tracking-wider">BarbHQ</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">© 2026 BarbHQ SaaS. All rights reserved.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors text-primary font-bold">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
