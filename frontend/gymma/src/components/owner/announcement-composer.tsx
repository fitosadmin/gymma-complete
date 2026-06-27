"use client";

import * as React from "react";
import { Send, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnnouncementComposer() {
  const [text, setText] = React.useState("");
  const [posted, setPosted] = React.useState<string[]>([
    "Holi special: bring a friend free this week! 🎉",
    "New squat racks installed in the strength zone.",
  ]);

  function post() {
    const t = text.trim();
    if (!t) return;
    setPosted((p) => [t, ...p]);
    setText("");
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary-500" />
        <h3 className="font-semibold text-neutral-900">Broadcast to members</h3>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="Share an update, offer, or milestone with all your members…"
        className="mt-3 w-full resize-none rounded-lg border border-neutral-200 p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-caption text-neutral-400">{text.length}/280</span>
        <Button size="sm" onClick={post} disabled={!text.trim()}>
          <Send className="h-3.5 w-3.5" />
          Post announcement
        </Button>
      </div>

      <div className="mt-5 space-y-2 border-t border-neutral-100 pt-4">
        <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">Recent</p>
        {posted.map((p, i) => (
          <p key={i} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{p}</p>
        ))}
      </div>
    </div>
  );
}
