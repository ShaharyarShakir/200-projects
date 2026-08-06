import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Cloud,
  HardDrive,
  Database,
  Shield,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  Play,
  Zap,
  FileText,
  ChevronRight,
  Activity,
  Terminal,
} from "lucide-react";
import { Button } from "../lib/component/ui/Button";
import { Card, CardContent } from "../lib/component/ui/Card";
import { useAuthStore } from "../features/auth/authStore";

export default function Home() {
  const { token } = useAuthStore();
  const [activeMockTab, setActiveMockTab] = useState("storage");

  return (
    <div className="space-y-24 pb-20 text-slate-800 dark:text-slate-200 animate-fade-in">
      {/* Hero Section */}
      <section className="relative pt-10 md:pt-16 max-w-6xl mx-auto px-4">
        {/* Glow Effects */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/10 to-emerald-400/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
          {/* Left Column: Heading and CTAs */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold tracking-wide uppercase mx-auto lg:mx-0">
              <Zap className="w-3.5 h-3.5" /> High Performance Object Storage
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Distributed Cloud Storage, <br />
              <span className="bg-clip-text bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 text-transparent">
                Reimagined.
              </span>
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Nimbus Drive connects directly to your private S3 storage cluster. Manage files, view
              real-time gateway status, and render instant previews. Fully powered by React, Vite,
              Express, and Garage.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {token ? (
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto font-bold gap-2">
                    Open Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto font-bold gap-2">
                      Get Started Free <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto font-bold border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20"
                    >
                      Login to Node
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Micro Stats */}
            <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  0ms
                </span>
                <span className="text-xs text-slate-400">Cold Start Uptime</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  99.9%
                </span>
                <span className="text-xs text-slate-400">Node Sync SLA</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  5 GB
                </span>
                <span className="text-xs text-slate-400">Free Cluster Quota</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Mock UI Preview */}
          <div className="flex-1 w-full max-w-xl">
            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f0e]/80 shadow-2xl p-6 overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Mock Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">nimbus-node-01:~</span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full text-teal-500 border border-slate-150 dark:border-slate-800 font-semibold font-mono">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> S3 Cluster Active
                </div>
              </div>

              {/* Mock App Interface tabs */}
              <div className="flex gap-2 my-4">
                <button
                  onClick={() => setActiveMockTab("storage")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeMockTab === "storage"
                      ? "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  Storage Quota
                </button>
                <button
                  onClick={() => setActiveMockTab("console")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeMockTab === "console"
                      ? "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  CLI Log Stream
                </button>
              </div>

              {/* Mock Body content */}
              <div className="h-64 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 p-5 flex flex-col justify-between">
                {activeMockTab === "storage" ? (
                  <div className="space-y-5 flex-1">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">
                          Bucket: nimbus-drive
                        </span>
                        <span className="text-teal-500">2.1 GB / 5.0 GB (42%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-700/40">
                        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full h-full w-[42%]" />
                      </div>
                    </div>

                    {/* Mock files items */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center bg-white dark:bg-[#0b0f0e]/60 p-2.5 border border-slate-100 dark:border-slate-900 rounded-xl">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-teal-500" />
                          <span className="text-xs font-medium truncate max-w-[200px]">
                            cluster_backup_2026.tar.gz
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">142.5 MB</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-[#0b0f0e]/60 p-2.5 border border-slate-100 dark:border-slate-900 rounded-xl">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-medium truncate max-w-[200px]">
                            system_metrics.json
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">1.2 KB</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-[10px] text-emerald-400 space-y-1.5 overflow-auto flex-1 text-left">
                    <p className="text-slate-500">[21:01:05] Initializing node connection...</p>
                    <p className="text-slate-400">[21:01:06] Mongo store synced successfully</p>
                    <p className="text-emerald-400 font-bold">
                      [21:01:06] S3 Gateway mapping active at localhost:3900
                    </p>
                    <p className="text-teal-400">
                      [21:02:14] GET /api/files/6a735b.../preview 200 OK (32ms)
                    </p>
                    <p className="text-slate-500">
                      [21:04:12] Bucket replication check: 0 changes detected
                    </p>
                  </div>
                )}

                {/* Simulated action */}
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-900 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" /> node-s3-garage-east
                  </span>
                  <span className="text-teal-500 font-mono">active ping: 12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for Private Cloud Deployments
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Nimbus Drive brings advanced enterprise file storage features straight to your
            self-hosted setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {/* Card 1 */}
          <Card className="hover:scale-[1.03] transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f0e]/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 mb-6">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Garage S3 API
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Connects straight to your dxflrs/garage S3 node. High performance distributed object
                storage.
              </p>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="hover:scale-[1.03] transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f0e]/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                MongoDB Metadata
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Indexes document metadata instantly, facilitating instant searches, custom naming,
                and star filters.
              </p>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="hover:scale-[1.03] transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f0e]/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6">
                <Play className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Streaming Previews
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Instantly streams images, video, audio, code, and PDFs in-app. Fully authenticated
                via token parameters.
              </p>
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="hover:scale-[1.03] transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f0e]/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Secure Gateway
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Custom helmet headers prevent same-origin blocking. Fully sandboxed file security
                pipelines.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* S3 Cluster Flow visualization */}
      <section className="max-w-4xl mx-auto px-4 border border-slate-200 dark:border-slate-800/85 bg-white dark:bg-[#0b0f0e]/30 rounded-3xl p-8 md:p-12 relative overflow-hidden text-center space-y-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Seamless Object Pipetree
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
            Here's how bytes flow from your browser through our secure nodes into S3 storage.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 relative z-10 pt-4">
          <div className="space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 font-bold text-lg font-mono">
              1
            </div>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              React Client
            </span>
            <span className="block text-[11px] text-slate-400">Buffered multipart chunk</span>
          </div>

          <ChevronRight className="w-6 h-6 text-teal-500 hidden md:block" />

          <div className="space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-lg font-mono">
              2
            </div>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Express API Node
            </span>
            <span className="block text-[11px] text-slate-400">Routes payload & Mongo log</span>
          </div>

          <ChevronRight className="w-6 h-6 text-teal-500 hidden md:block" />

          <div className="space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
              3
            </div>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Garage S3 Cluster
            </span>
            <span className="block text-[11px] text-slate-400">Distributed bucket replication</span>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="text-center max-w-xl mx-auto space-y-6 px-4">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Ready to Host Your Files?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Connect to your S3 cluster in less than a minute. Secure, scalable, and fully controlled
          by you.
        </p>
        <Link to="/register">
          <Button size="lg" className="font-bold py-3 px-8 mt-2">
            Deploy Nimbus Drive <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
