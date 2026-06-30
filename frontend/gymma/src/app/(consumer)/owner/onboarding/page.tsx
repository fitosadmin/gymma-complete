"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, Shield, Plus, Trash2, Camera, Dumbbell, Droplets } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// The endpoint for uploading photos (we will just mock it on frontend or use a base64 string for this exercise)
// In a real scenario, this would use a signed URL to upload to S3, or hit an endpoint that returns a URL.
// For now, we will simulate it by reading as data URL so it displays in UI, and we'll send data URL to the backend
// if it accepts it. (Wait, the backend onboard endpoint expects `url` string. It doesn't handle S3 upload yet.
// We'll mock the URL upload for now.)

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    opens_at: "06:00:00",
    closes_at: "22:00:00",
    amenities: [] as { name: string; category: string }[],
    photos: [] as { url: string; category: string; caption?: string; is_cover: boolean }[],
    trainers: [] as { name: string; specialization: string }[],
    plans: [] as { name: string; duration_months: number; price: number; description: string; is_recommended: boolean }[]
  });

  useEffect(() => {
    // Route protection
    import("@/lib/auth").then(({ isAuthenticated }) => {
      if (!isAuthenticated()) {
        router.replace("/owner/login");
      }
    });
  }, [router]);

  const updateForm = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { getAccessToken, getUser } = await import("@/lib/auth");
      const token = getAccessToken();
      const user = getUser();
      
      if (!token || !user) throw new Error("Not authenticated");

      // In a real app we need the GYM ID. We assume the owner only has one gym for now.
      // We will fetch the owner's gym ID from `/api/v1/owner/gyms`
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      
      const gymsRes = await fetch(`${API_URL}/owner/gyms`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const gymsData = await gymsRes.json();
      if (!gymsData.success || !gymsData.data || gymsData.data.length === 0) {
        throw new Error("No gym profile found for this owner account. Please contact support.");
      }
      
      const gymId = gymsData.data[0].id;

      // Submit the massive payload
      const onboardRes = await fetch(`${API_URL}/owner/gyms/${gymId}/onboard`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const onboardData = await onboardRes.json();
      if (!onboardData.success) {
        throw new Error(onboardData.error?.message || "Failed to submit onboarding data");
      }

      router.push("/owner/dashboard?onboarded=true");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  // Helper component for simple mockup image upload
  const PhotoUpload = ({ category, icon: Icon, title, description }: any) => {
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Mock upload - convert to object URL for preview, and we'd normally upload it to server
        // For the sake of this UI, we'll just push a mock URL
        const mockUrl = URL.createObjectURL(file);
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, { url: mockUrl, category, is_cover: prev.photos.length === 0 }]
        }));
      }
    };

    const categoryPhotos = formData.photos.filter(p => p.category === category);

    return (
      <div className="border border-neutral-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            <p className="text-sm text-neutral-500">{description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categoryPhotos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 group">
              <Image src={photo.url} alt="upload preview" fill className="object-cover" />
              <button 
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    photos: prev.photos.filter(p => p.url !== photo.url)
                  }));
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
            <Plus size={24} className="mb-2" />
            <span className="text-xs font-medium">Add Photo</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Gym Onboarding</h1>
          <p className="text-neutral-500 mt-1">Complete your gym profile to start receiving members.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary-500' : 'bg-neutral-200'}`} />
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: Basic & Timings */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Timings & Basics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Opening Time</label>
                  <input 
                    type="time" 
                    className="input w-full"
                    value={formData.opens_at}
                    onChange={(e) => updateForm('opens_at', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Closing Time</label>
                  <input 
                    type="time" 
                    className="input w-full"
                    value={formData.closes_at}
                    onChange={(e) => updateForm('closes_at', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Photos */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Photos & Visuals</h2>
              <p className="text-sm text-neutral-500 mb-6">High quality photos attract more members. Please upload real photos of your facility.</p>
              
              <PhotoUpload category="gym" icon={Camera} title="Gym Area" description="Wide shots of the main workout floor." />
              <PhotoUpload category="equipment" icon={Dumbbell} title="Equipment" description="Closeups of your machines and free weights." />
              <PhotoUpload category="washroom" icon={Droplets} title="Washrooms / Lockers" description="Clean facilities are a major selling point." />
            </div>
          )}

          {/* STEP 3: Trainers */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Trainers (Optional)</h2>
              <p className="text-sm text-neutral-500 mb-6">Add floor trainers or personal trainers available at your gym.</p>
              
              {formData.trainers.map((trainer, idx) => (
                <div key={idx} className="flex gap-4 items-end mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Name</label>
                    <input 
                      className="input w-full" 
                      placeholder="Trainer name" 
                      value={trainer.name}
                      onChange={e => {
                        const t = [...formData.trainers];
                        t[idx].name = e.target.value;
                        updateForm('trainers', t);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Specialization</label>
                    <input 
                      className="input w-full" 
                      placeholder="e.g. Strength, Zumba" 
                      value={trainer.specialization}
                      onChange={e => {
                        const t = [...formData.trainers];
                        t[idx].specialization = e.target.value;
                        updateForm('trainers', t);
                      }}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      const t = formData.trainers.filter((_, i) => i !== idx);
                      updateForm('trainers', t);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => updateForm('trainers', [...formData.trainers, { name: "", specialization: "" }])}
              >
                <Plus size={16} className="mr-2" /> Add Trainer
              </Button>
            </div>
          )}

          {/* STEP 4: Membership Plans */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Membership Plans</h2>
              <p className="text-sm text-neutral-500 mb-6">Add your standard 1, 3, 6, and 12 month plans.</p>
              
              {formData.plans.map((plan, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100 relative">
                  <button 
                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    onClick={() => updateForm('plans', formData.plans.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Name</label>
                    <input className="input w-full" placeholder="e.g. Annual" value={plan.name} onChange={e => { const p = [...formData.plans]; p[idx].name = e.target.value; updateForm('plans', p); }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Months</label>
                    <input type="number" className="input w-full" value={plan.duration_months} onChange={e => { const p = [...formData.plans]; p[idx].duration_months = Number(e.target.value); updateForm('plans', p); }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Price (₹)</label>
                    <input type="number" className="input w-full" value={plan.price} onChange={e => { const p = [...formData.plans]; p[idx].price = Number(e.target.value); updateForm('plans', p); }} />
                  </div>
                  <div className="col-span-2 sm:col-span-4 mt-2">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Description (Optional)</label>
                    <input className="input w-full" placeholder="e.g. Includes group classes" value={plan.description} onChange={e => { const p = [...formData.plans]; p[idx].description = e.target.value; updateForm('plans', p); }} />
                  </div>
                </div>
              ))}
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => updateForm('plans', [...formData.plans, { name: "", duration_months: 1, price: 0, description: "", is_recommended: false }])}
              >
                <Plus size={16} className="mr-2" /> Add Plan
              </Button>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Ready to submit!</h2>
              <p className="text-neutral-500 max-w-md mx-auto mb-8">
                Your profile looks great. Click submit to finish onboarding and publish your gym to our platform.
              </p>
              
              <div className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col gap-2 text-sm text-neutral-600 mb-8">
                <div className="flex justify-between"><span>Timings:</span> <span>{formData.opens_at} - {formData.closes_at}</span></div>
                <div className="flex justify-between"><span>Photos:</span> <span>{formData.photos.length} uploaded</span></div>
                <div className="flex justify-between"><span>Trainers:</span> <span>{formData.trainers.length} added</span></div>
                <div className="flex justify-between"><span>Plans:</span> <span>{formData.plans.length} added</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-between items-center">
          {step > 1 ? (
            <Button variant="ghost" onClick={handlePrev} disabled={isSubmitting}>
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>
          ) : <div />}
          
          {step < 5 ? (
            <Button onClick={handleNext}>
              Next <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700 text-white">
              {isSubmitting ? "Submitting..." : "Submit Profile"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
