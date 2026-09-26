"use client";

import { Star, CheckCircle2 } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Marcus Chen",
      role: "Staff Backend Engineer",
      company: "HyperScale Cloud",
      avatarInitials: "MC",
      avatarBg: "bg-blue-600",
      rating: 5,
      metricBadge: "4.2 hrs saved / incident",
      quote:
        "Bisect transformed how our team handles test flakiness and regression triages. Running binary searches across hundreds of commits in disposable Podman containers saves us hours on every release cycle.",
    },
    {
      name: "Elena Rostova",
      role: "Core OSS Maintainer",
      company: "Distributed Python",
      avatarInitials: "ER",
      avatarBg: "bg-purple-600",
      rating: 5,
      metricBadge: "85% faster triage",
      quote:
        "When upstream commits introduce subtle regressions, finding the exact commit was painful. With Bisect's Groq-powered analysis, I get the culprit commit and verified patch proposal in seconds.",
    },
    {
      name: "David Vance",
      role: "Lead Platform SRE",
      company: "FinTech Infrastructure",
      avatarInitials: "DV",
      avatarBg: "bg-emerald-600",
      rating: 5,
      metricBadge: "Zero unreviewed writes",
      quote:
        "The human-in-the-loop safety gate is what sets Bisect apart. We have strict security policies, and knowing the agent cannot execute changes without explicit approval gives us complete confidence.",
    },
  ];

  return (
    <section id="reviews" className="relative py-20 md:py-28 bg-[#090d16]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>Developer Reviews & Proof</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Trusted by engineers who care about speed and safety
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            See how engineering teams use Bisect to automate regression finding and
            protect code quality.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-md transition-all hover:border-slate-700"
            >
              <div>
                {/* Star Ratings & Impact Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-blue-300">
                    {t.metricBadge}
                  </span>
                </div>

                {/* Quote Body */}
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${t.avatarBg}`}
                >
                  {t.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">{t.name}</h3>
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {t.role} • <span className="text-slate-300">{t.company}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
