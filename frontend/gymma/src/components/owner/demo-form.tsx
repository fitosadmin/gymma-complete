"use client";

import * as React from "react";
import { Check, ArrowRight, ChevronDown, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8085/api/v1";

const inputCls =
  "h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none w-full";

interface FormData {
  name: string;
  phone: string;
  email: string;
  gymName: string;
  city: string;
  area: string;
  memberCount: string;
  notes: string;
}

export function DemoForm() {
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    phone: "",
    email: "",
    gymName: "",
    city: "",
    area: "",
    memberCount: "",
    notes: "",
  });

  function update(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gymName: formData.gymName.trim(),
      };
      if (formData.city.trim()) body.city = formData.city.trim();
      if (formData.area.trim()) body.area = formData.area.trim();
      if (formData.memberCount) body.memberCount = formData.memberCount;
      if (formData.notes.trim()) body.notes = formData.notes.trim();

      const res = await fetch(`${API_URL}/demo-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json?.error?.message ??
          (Array.isArray(json?.error?.details)
            ? json.error.details.map((d: { message: string }) => d.message).join(", ")
            : null) ??
          "Something went wrong. Please try again.";
        setError(msg);
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-h4 text-white">Request received!</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          Thanks <strong className="text-white">{formData.name}</strong>! A Gymma advisor will reach
          out to <strong className="text-white">{formData.phone}</strong> within 24 hours to set up
          your walkthrough.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Your name" className={inputCls} required value={formData.name} onChange={update("name")} />
        <input
          type="tel"
          placeholder="Phone number"
          className={inputCls}
          required
          pattern="[6-9][0-9]{9}"
          title="Enter a valid 10-digit Indian mobile number"
          value={formData.phone}
          onChange={update("phone")}
        />
      </div>
      <input type="email" placeholder="Work email" className={inputCls} required value={formData.email} onChange={update("email")} />
      <input placeholder="Gym name" className={inputCls} required value={formData.gymName} onChange={update("gymName")} />
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="City" className={inputCls} value={formData.city} onChange={update("city")} />
        <input placeholder="Area / Locality" className={inputCls} value={formData.area} onChange={update("area")} />
      </div>
      <div className="relative">
        <select value={formData.memberCount} onChange={update("memberCount")} className={`${inputCls} appearance-none text-neutral-400`}>
          <option className="bg-[#111111] text-white" value="" disabled>Number of members</option>
          <option className="bg-[#111111] text-white" value="<100">Less than 100</option>
          <option className="bg-[#111111] text-white" value="100-300">100–300</option>
          <option className="bg-[#111111] text-white" value="300-600">300–600</option>
          <option className="bg-[#111111] text-white" value="600+">600+</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
      <textarea rows={3} placeholder="Anything specific you'd like to cover? (optional)" className={`${inputCls} h-auto resize-none py-3`} value={formData.notes} onChange={update("notes")} />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
        ) : (
          <>Request demo<ArrowRight className="h-4 w-4" /></>
        )}
      </button>
    </form>
  );
}
