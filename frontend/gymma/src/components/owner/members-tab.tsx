"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMembers, addMember } from "@/lib/api";

export function MembersTab({ gymId, token }: { gymId: string, token: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    if (gymId === "no-gym") {
      setLoading(false);
      return;
    }
    try {
      const data = await listMembers(gymId, token);
      setMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [gymId, token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addMember(gymId, token, { fullName, phone });
      setShowAdd(false);
      setFullName("");
      setPhone("");
      await fetchMembers();
    } catch (e) {
      alert("Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (gymId === "no-gym") {
    return (
      <div className="flex flex-col gap-6 mt-6">
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
          <p className="text-neutral-500 font-medium">You need to onboard your gym first!</p>
          <p className="text-caption text-neutral-400 mt-1">Please complete the gym setup to start adding members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Gym Members</h2>
          <p className="text-sm text-neutral-500">Manage your active and expired members.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm mb-6 max-w-2xl">
          <div className="mb-5 border-b border-neutral-100 pb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Add New Member</h3>
            <p className="text-sm text-neutral-500">Enter member details to enroll them.</p>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2.5"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2.5"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md bg-blue-50 p-3 flex gap-2 items-start border border-blue-100">
              <Users className="h-4 w-4 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-800">
                The member can log into the Gymma mobile app using this phone number and the default password <strong>Gymma@1234</strong>.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add Member"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-neutral-500">No members found. Add your first member above.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {members.map((m) => (
                <tr key={m.membership_id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium text-neutral-900">{m.full_name}</td>
                  <td className="px-6 py-4">{m.phone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(m.start_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
