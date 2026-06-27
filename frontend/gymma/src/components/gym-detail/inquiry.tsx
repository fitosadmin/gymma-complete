"use client";

import * as React from "react";
import { Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InquiryApi {
  open: (plan?: string) => void;
}
const InquiryCtx = React.createContext<InquiryApi | null>(null);

export function useInquiry() {
  const ctx = React.useContext(InquiryCtx);
  if (!ctx) throw new Error("useInquiry must be used within InquiryProvider");
  return ctx;
}

interface GymContact {
  name: string;
  phone: string;
  whatsapp: string;
}

export function InquiryProvider({ gym, children }: { gym: GymContact; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [plan, setPlan] = React.useState<string | undefined>();
  const api = React.useMemo<InquiryApi>(
    () => ({ open: (p) => { setPlan(p); setOpen(true); } }),
    []
  );

  return (
    <InquiryCtx.Provider value={api}>
      {children}
      <InquiryModal gym={gym} plan={plan} open={open} onClose={() => setOpen(false)} />
    </InquiryCtx.Provider>
  );
}

function InquiryModal({
  gym,
  plan,
  open,
  onClose,
}: {
  gym: GymContact;
  plan?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState<{ name?: string; phone?: string; msg?: string }>({});

  React.useEffect(() => {
    if (open) {
      setSent(false);
      setErr({});
      setMsg(plan ? `Hi, I'm interested in the ${plan} membership at ${gym.name}.` : "");
    }
  }, [open, plan, gym.name]);

  function submit() {
    const e: typeof err = {};
    if (name.trim().length < 2) e.name = "Enter your name";
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit mobile number";
    if (msg.length > 500) e.msg = "Message too long (max 500)";
    setErr(e);
    if (Object.keys(e).length) return;
    setSent(true); // no backend yet — would POST /inquiries
  }

  const waLink = `https://wa.me/${gym.whatsapp.replace(/\D/g, "")}`;

  return (
    <Modal open={open} onClose={onClose} title={sent ? "Inquiry sent" : `Contact ${gym.name}`}>
      {sent ? (
        <div className="flex flex-col items-center py-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-secondary-500" />
          <p className="mt-3 text-body text-neutral-700">
            Thanks! The gym will reach out to you shortly. You can also message them directly on WhatsApp.
          </p>
          <a href={waLink} target="_blank" rel="noreferrer" className="mt-4">
            <Button variant="secondary">
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp
            </Button>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} error={err.name} />
          <Input
            placeholder="Mobile number"
            inputMode="numeric"
            iconLeft={<Phone className="h-4 w-4" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={err.phone}
          />
          <div>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={3}
              placeholder="Message (optional)"
              className="w-full rounded-sm border border-neutral-200 p-3 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:border-primary-500"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-caption text-error">{err.msg ?? ""}</span>
              <span className="text-caption text-neutral-400">{msg.length}/500</span>
            </div>
          </div>
          <Button fullWidth onClick={submit}>
            Send inquiry
          </Button>
          <p className="text-center text-caption text-neutral-400">
            No payment required · The gym contacts you directly
          </p>
        </div>
      )}
    </Modal>
  );
}
