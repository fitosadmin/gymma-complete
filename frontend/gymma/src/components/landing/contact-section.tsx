"use client";

import * as React from "react";
import { Mail, Phone, Clock } from "lucide-react";

export function ContactSection() {
  const [sent, setSent] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  const inputCls =
    "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none transition-colors";

  return (
    <section id="contact" className="border-t border-neutral-200 bg-neutral-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Centered heading */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-500">Get in touch</p>
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900">Questions? We&apos;re here.</h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-500">
            Whether you&apos;re a gym seeker or a gym owner,
            <br className="hidden sm:block" />
            drop us a message and we&apos;ll get back within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[5fr_9fr]">
          {/* ── Left info panel — light grey, matching screenshot ─────────── */}
          <div className="flex flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-100 p-8">
            {/* Email */}
            <div className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Email</p>
                <a
                  href="mailto:hello@gymma.in"
                  className="text-base font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  hello@gymma.in
                </a>
              </div>
            </div>

            <div className="border-t border-neutral-300" />

            {/* Phone */}
            <div className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Phone</p>
                <a
                  href="tel:+918000000000"
                  className="text-base font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  +91 80000 00000
                </a>
              </div>
            </div>

            {/* "We're here for you!" badge — warm beige, matching screenshot */}
            <div className="mt-auto rounded-xl bg-[#fdf0e8] px-5 py-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#7c4a1e]" />
                <span className="text-sm font-bold text-[#7c4a1e]">We&apos;re here for you!</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500">
                Our team typically responds within 24 hours.
              </p>
            </div>
          </div>

          {/* ── Right form panel ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-6 w-6 text-green-600" />
                </span>
                <h3 className="text-lg font-semibold text-neutral-900">Message sent!</h3>
                <p className="text-sm text-neutral-500">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputCls}
                  />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className={inputCls}
                  />
                </div>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className={inputCls}
                />
                <textarea
                  required
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message"
                  className={`${inputCls} resize-none`}
                />
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
