"use client";

import * as React from "react";
import { Check, ArrowRight, ChevronDown } from "lucide-react";

const inputCls =
  "h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none";

export function DemoForm() {
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-h4 text-white">Request received</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          Thanks! A Gymma advisor will reach out within 24 hours to set up your walkthrough.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Your name" className={inputCls} required />
        <input type="tel" placeholder="Phone number" className={inputCls} required />
      </div>
      <input type="email" placeholder="Work email" className={inputCls} required />
      <input placeholder="Gym name" className={inputCls} required />
      <input placeholder="City / Area" className={inputCls} />
      <div className="relative">
        <select defaultValue="" className={`${inputCls} appearance-none text-neutral-400 w-full`}>
          <option value="" disabled>Number of members</option>
          <option value="<100">Less than 100</option>
          <option value="100-300">100–300</option>
          <option value="300-600">300–600</option>
          <option value="600+">600+</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
      <textarea
        rows={3}
        placeholder="Anything specific you'd like to cover? (optional)"
        className={`${inputCls} h-auto resize-none py-3`}
      />
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
      >
        Request demo
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
