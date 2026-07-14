"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getUser, clearSession } from "@/lib/auth";
import { listDemoRequests, updateDemoRequest, listInquiries, onboardDemoRequest } from "@/lib/api";
import type { DemoRequest, Inquiry, DemoStatus } from "@/lib/api";
import {
  LayoutDashboard, Users, MessageSquare, LogOut, RefreshCw,
  Search, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";

const STATUS_OPTIONS: DemoStatus[] = ["pending", "contacted", "converted", "rejected"];

const STATUS_STYLES: Record<string, string> = {
  pending: "badge badge-new",
  contacted: "badge badge-contacted",
  converted: "badge badge-converted",
  rejected: "badge badge-rejected",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 700, color: color ?? "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

type Tab = "leads" | "inquiries";

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [tab, setTab] = useState<Tab>("leads");

  // Leads state
  const [leads, setLeads] = useState<DemoRequest[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsFilter, setLeadsFilter] = useState("");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Inquiries state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesTotal, setInquiriesTotal] = useState(0);
  const [inquiriesPage, setInquiriesPage] = useState(1);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const t = getAccessToken();
    const u = getUser();
    if (!t || !u) { router.replace("/"); return; }
    setToken(t);
    setUser(u);
  }, [router]);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLeadsLoading(true);
    try {
      const res = await listDemoRequests(token, {
        page: leadsPage, limit: PAGE_SIZE,
        status: leadsFilter || undefined,
      });
      setLeads(res.data);
      setLeadsTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setLeadsLoading(false); }
  }, [token, leadsPage, leadsFilter]);

  const fetchInquiries = useCallback(async () => {
    if (!token) return;
    setInquiriesLoading(true);
    try {
      const res = await listInquiries(token, { page: inquiriesPage, limit: PAGE_SIZE });
      setInquiries(res.data);
      setInquiriesTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setInquiriesLoading(false); }
  }, [token, inquiriesPage]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { if (tab === "inquiries") fetchInquiries(); }, [tab, fetchInquiries]);

  async function changeStatus(id: string, status: DemoStatus) {
    if (!token) return;
    setUpdatingId(id);
    try {
      await updateDemoRequest(token, id, status);
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  async function handleOnboard(id: string) {
    if (!token) return;
    if (!confirm("Are you sure you want to onboard this lead? This will create a gym owner account and start their onboarding process.")) return;
    setUpdatingId(id);
    try {
      await onboardDemoRequest(token, id);
      alert("Successfully onboarded!");
      fetchLeads();
    } catch (err: any) {
      alert("Failed to onboard: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  const filtered = leads.filter((l) => {
    if (!leadsSearch) return true;
    const q = leadsSearch.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.gymName.toLowerCase().includes(q) ||
           l.phone.includes(q) || l.email.toLowerCase().includes(q);
  });

  // Computed stats
  const newCount = leads.filter((l) => l.status === "pending").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
  const convertedCount = leads.filter((l) => l.status === "converted").length;

  const leadsPages = Math.ceil(leadsTotal / PAGE_SIZE);
  const inquiriesPages = Math.ceil(inquiriesTotal / PAGE_SIZE);

  if (!token) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #5b4bd1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>G</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Gymma</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setTab("leads")} className={`sidebar-link${tab === "leads" ? " active" : ""}`} style={{ width: "100%", textAlign: "left" }}>
            <LayoutDashboard size={16} />Leads
          </button>
          <button onClick={() => setTab("inquiries")} className={`sidebar-link${tab === "inquiries" ? " active" : ""}`} style={{ width: "100%", textAlign: "left" }}>
            <MessageSquare size={16} />Inquiries
          </button>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {user.avatarUrl && <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
                <div style={{ overflow: "hidden" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName ?? user.email}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{user.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ height: 32, fontSize: 12 }}>
                <LogOut size={13} />Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div className="topbar">
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {tab === "leads" ? "Partner Leads" : "Member Inquiries"}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {tab === "leads" ? "Gym owners who requested a demo" : "Members who contacted gyms"}
            </p>
          </div>
          <button onClick={tab === "leads" ? fetchLeads : fetchInquiries} className="btn btn-ghost" style={{ height: 36, fontSize: 12, gap: 6 }}>
            <RefreshCw size={13} />Refresh
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {tab === "leads" && (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: 16 }}>
                <StatCard label="Total Leads" value={leadsTotal} />
                <StatCard label="New" value={newCount} color="var(--blue)" />
                <StatCard label="Contacted" value={contactedCount} color="var(--amber)" />
                <StatCard label="Converted" value={convertedCount} color="var(--green)" />
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    className="input" style={{ paddingLeft: 32 }}
                    placeholder="Search by name, gym, phone or email…"
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                  />
                </div>
                <div style={{ position: "relative" }}>
                  <select className="select" value={leadsFilter} onChange={(e) => { setLeadsFilter(e.target.value); setLeadsPage(1); }}>
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {leadsLoading ? (
                  <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading leads…</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                    <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <p>No leads found</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Gym</th>
                          <th>City / Area</th>
                          <th>Members</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((lead) => (
                          <tr key={lead.id}>
                            <td style={{ fontWeight: 600 }}>{lead.name}</td>
                            <td style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>{lead.phone}</td>
                            <td style={{ color: "var(--text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.email}</td>
                            <td style={{ fontWeight: 500 }}>{lead.gymName}</td>
                            <td style={{ color: "var(--text-muted)" }}>{[lead.area, lead.city].filter(Boolean).join(", ") || "—"}</td>
                            <td style={{ color: "var(--text-muted)" }}>{lead.memberCount ?? "—"}</td>
                            <td>
                              <div style={{ position: "relative", display: "flex", gap: "8px", alignItems: "center" }}>
                                <select
                                  className="select"
                                  value={lead.status}
                                  disabled={updatingId === lead.id}
                                  onChange={(e) => changeStatus(lead.id, e.target.value as DemoStatus)}
                                  style={{ height: 30, fontSize: 12, paddingRight: 24, paddingLeft: 8 }}
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                  ))}
                                </select>
                                {lead.status !== "converted" && lead.status !== "rejected" && (
                                  <button
                                    onClick={() => handleOnboard(lead.id)}
                                    disabled={updatingId === lead.id}
                                    style={{
                                      height: 30, padding: "0 10px", fontSize: 12,
                                      background: "var(--accent)", color: "#fff",
                                      border: "none", borderRadius: "6px", cursor: "pointer",
                                      fontWeight: 600
                                    }}
                                  >
                                    Onboard
                                  </button>
                                )}
                              </div>
                            </td>
                            <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(lead.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {leadsPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0 }} disabled={leadsPage === 1} onClick={() => setLeadsPage((p) => p - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{leadsPage} / {leadsPages}</span>
                  <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0 }} disabled={leadsPage === leadsPages} onClick={() => setLeadsPage((p) => p + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "inquiries" && (
            <>
              <div style={{ display: "flex", gap: 16 }}>
                <StatCard label="Total Inquiries" value={inquiriesTotal} />
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {inquiriesLoading ? (
                  <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading inquiries…</div>
                ) : inquiries.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                    <MessageSquare size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <p>No member inquiries yet</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Gym</th>
                          <th>Message</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.map((inq) => (
                          <tr key={inq.id}>
                            <td style={{ fontWeight: 600 }}>{inq.name}</td>
                            <td style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{inq.phone}</td>
                            <td>{inq.gymName}</td>
                            <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{inq.message ?? "—"}</td>
                            <td><span className={STATUS_STYLES[inq.status] ?? "badge"}>{inq.status}</span></td>
                            <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(inq.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {inquiriesPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0 }} disabled={inquiriesPage === 1} onClick={() => setInquiriesPage((p) => p - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{inquiriesPage} / {inquiriesPages}</span>
                  <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0 }} disabled={inquiriesPage === inquiriesPages} onClick={() => setInquiriesPage((p) => p + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
