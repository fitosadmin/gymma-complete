import * as React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Gymma",
  description: "Terms and conditions for using the Gymma discovery platform.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:py-32">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Terms of Service</h1>
        <p className="mt-4 text-base text-neutral-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="text-base [&_a]:text-primary-600 [&_a]:underline [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-neutral-900 [&_li]:mb-2 [&_li]:text-neutral-600 [&_p]:mb-6 [&_p]:leading-relaxed [&_p]:text-neutral-600 [&_strong]:font-semibold [&_strong]:text-neutral-900 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-5">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Gymma platform, website, and associated services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Gymma provides a gym discovery and comparison platform. We aggregate information, reviews, and pricing about various fitness centers to help users make informed decisions. We are not responsible for the direct operations, pricing accuracy, or safety of the gyms listed on our platform.
        </p>

        <h2>3. User Accounts and Responsibilities</h2>
        <p>
          When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
        </p>

        <h2>4. Content and Reviews</h2>
        <ul>
          <li><strong>User-Generated Content:</strong> You retain any and all of your rights to any content you submit, post or display on or through the Service, including reviews.</li>
          <li><strong>Accuracy:</strong> Reviews must represent your genuine, first-hand experience with a gym. We reserve the right to remove reviews that violate our community guidelines, contain hate speech, or are identified as spam.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property of Gymma and its licensors. The Service is protected by copyright, trademark, and other laws of India and foreign countries.
        </p>

        <h2>6. Links to Other Web Sites</h2>
        <p>
          Our Service may contain links to third-party web sites or services that are not owned or controlled by Gymma. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at <strong>legal@gymma.com</strong>.
        </p>
      </div>
    </main>
  );
}
