import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useOwnerTerms } from "./useOwnerTerms";

export default function DigitalCheckinOwnerterms() {
  useHtmlPage({
    title: "Owner Terms & Conditions",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/ownerterms.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const {
    status,
    acceptTerms,
    setAcceptTerms,
    handleSubmit
  } = useOwnerTerms();

  return (
    <div className="html-page">
      <header className="dc-header">
        <div className="dc-header-inner">
          <img src="/website/roomhy_logo.jpeg" alt="Roomhy Logo" className="dc-logo" style={{ background: "#fff", padding: "4px 8px", borderRadius: 6 }} />
          <div>
            <p className="dc-eyebrow">Digital Check-In</p>
            <h1 className="dc-header-title">Owner Terms</h1>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="hero-card">
          <p className="hero-kicker">Final Step</p>
          <h2 className="hero-title">Review and accept the owner terms</h2>
          <p className="hero-copy">Read and accept the terms below to complete owner onboarding.</p>
        </div>
        {status ? <div className="status">{status}</div> : null}
        <div className="terms">
          <div className="line"><strong>1. Introduction</strong><br />By registering as a Property Owner/Landlord on Roomhy ("Platform"), you agree to comply with and be bound by these Terms & Conditions. These terms govern your access to and use of the Platform to list properties, manage tenants, and receive payments.</div>
          <div className="line"><strong>2. Eligibility</strong><br />You confirm that: You are the legal owner or authorized representative of the property listed. The property details shared are accurate and lawful. You have the legal right to rent/lease the property.</div>
          <div className="line"><strong>3. Property Listing & Content</strong><br />You are responsible for the accuracy of property details, rent amount, photos, availability, and house rules. Any misleading or false information may lead to suspension or removal from the platform. Roomhy may review, edit, or remove listings that violate policies or laws.</div>
          <div className="line"><strong>4. Tenant Interaction</strong><br />All communications with tenants must be professional and lawful. You agree not to discriminate based on religion, gender, caste, or any protected category. Roomhy is not responsible for disputes between owners and tenants.</div>
          <div className="line"><strong>5. Payments & Payouts</strong><br />Rent payments collected through the Platform may be routed directly to the Owner's registered bank account or UPI as per the selected payout method. Owners are responsible for providing correct and up-to-date bank/UPI details. Any delays caused by incorrect details or bank issues are not the responsibility of Roomhy. Roomhy may deduct agreed service fees or commissions before or after payouts, as per the commercial agreement.</div>
          <div className="line"><strong>6. Service Fees / Commission</strong><br />Roomhy may charge a platform service fee or commission for facilitating bookings, tenant management, or payments. The applicable fees will be displayed or communicated before activation. Fees are non-refundable once a transaction is completed.</div>
          <div className="line"><strong>7. KYC & Verification</strong><br />Owners must complete KYC verification as required by law or platform policy. Documents such as ID proof, address proof, and bank verification may be required. Failure to complete verification may result in restricted access or payout suspension.</div>
          <div className="line"><strong>8. Compliance with Laws</strong><br />You agree to comply with all applicable local, state, and national laws related to renting property, taxation, and tenant rights. Any legal issues arising from the property, tenancy, or disputes are the Owner's responsibility.</div>
          <div className="line"><strong>9. Termination & Suspension</strong><br />Roomhy reserves the right to suspend or terminate owner accounts for policy violations, fraud, or misuse of the platform. Owners may request account deactivation, subject to settlement of any pending dues or obligations.</div>
          <div className="line"><strong>10. Limitation of Liability</strong><br />Roomhy acts only as a technology platform connecting owners and tenants. Roomhy is not responsible for tenant behavior, property damage, payment defaults, or disputes. The Owner agrees to indemnify Roomhy against claims arising from property listings or tenant interactions.</div>
          <div className="line"><strong>11. Data & Privacy</strong><br />Owner data will be handled as per Roomhy's Privacy Policy. You consent to receive notifications, reminders, and transaction updates via WhatsApp, SMS, Email, or other channels.</div>
          <div className="line"><strong>12. Changes to Terms</strong><br />Roomhy may update these Terms & Conditions from time to time. Continued use of the Platform after updates implies acceptance of the revised terms.</div>
          <div className="line"><strong>13. Governing Law</strong><br />These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of the courts in India.</div>
        </div>
        <div className="row">
          <label>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            I accept the Terms & Conditions.
          </label>
        </div>
        <button type="button" onClick={handleSubmit}>Accept & Submit</button>
      </div>
    </div>
  );
}

