import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Gymma",
  description: "Privacy Policy for Gymma, India's leading gym discovery platform.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:py-32">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
        <p className="mt-4 text-base text-neutral-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-600">
        <p>
          At Gymma, accessible from our website and mobile applications, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Gymma and how we use it.
        </p>
        
        <h2>1. Information We Collect</h2>
        <p>
          We collect several different types of information for various purposes to provide and improve our service to you:
        </p>
        <ul>
          <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you, such as your email address, first name, last name, phone number, and location data.</li>
          <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used, including your device's Internet Protocol address, browser type, pages visited, and the time and date of your visit.</li>
          <li><strong>Location Data:</strong> We may use and store information about your location if you give us permission to do so, to help you discover gyms near you.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>
          Gymma uses the collected data for various purposes:
        </p>
        <ul>
          <li>To provide and maintain our Service, including GPS-powered discovery.</li>
          <li>To notify you about changes to our Service or gym listings.</li>
          <li>To allow you to participate in interactive features when you choose to do so.</li>
          <li>To provide customer support and respond to inquiries.</li>
          <li>To gather analysis or valuable information so that we can improve our Service.</li>
        </ul>

        <h2>3. Third-Party Privacy Policies</h2>
        <p>
          Gymma's Privacy Policy does not apply to other advertisers or websites, such as the individual gyms listed on our platform. We advise you to consult the respective Privacy Policies of these third-party services for more detailed information.
        </p>

        <h2>4. Contact Us</h2>
        <p>
          If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <strong>privacy@gymma.com</strong>.
        </p>
      </div>
    </main>
  );
}
