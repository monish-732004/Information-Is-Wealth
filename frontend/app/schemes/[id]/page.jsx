"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const BENEFIT_COLORS = {
  cash_transfer:  { bg: "#eff6ff", color: "#1d4ed8", label: "Cash Transfer" },
  scholarship:    { bg: "#f0fdf4", color: "#15803d", label: "Scholarship" },
  subsidy:        { bg: "#fefce8", color: "#854d0e", label: "Subsidy" },
  insurance:      { bg: "#f5f3ff", color: "#6d28d9", label: "Insurance" },
  housing:        { bg: "#fff7ed", color: "#9a3412", label: "Housing" },
  employment:     { bg: "#f0fdf4", color: "#166534", label: "Employment" },
  healthcare:     { bg: "#fdf2f8", color: "#9d174d", label: "Healthcare" },
  food_subsidy:   { bg: "#fff7ed", color: "#c2410c", label: "Food Subsidy" },
  savings_scheme: { bg: "#eff6ff", color: "#1e40af", label: "Savings" },
  other:          { bg: "#f9fafb", color: "#374151", label: "Scheme" },
};

const DOC_LABELS = {
  aadhaar:               "Aadhaar Card",
  ration_card:           "Ration Card",
  bank_passbook:         "Bank Passbook",
  caste_certificate:     "Caste Certificate",
  income_certificate:    "Income Certificate",
  land_records:          "Land Records",
  mark_sheet:            "Mark Sheet / Certificates",
  birth_certificate:     "Birth Certificate",
  guardian_id:           "Guardian ID Proof",
  education_certificate: "Education Certificate",
  project_report:        "Project Report",
  mobile_number:         "Mobile Number",
  bpl_card:              "BPL Card",
  none_required:         "No documents required",
};

export default function SchemeDetailPage({ params }) {
  const router = useRouter();
  const id = params.id;

  const [scheme,  setScheme]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchScheme();
  }, [id]);

  const fetchScheme = async () => {
    try {
      const res = await fetch(`${API_URL}/schemes/${id}`);
      if (!res.ok) throw new Error("Scheme not found");
      setScheme(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "Inter, sans-serif" }}>
      {[80, 200, 120, 160].map((w, i) => (
        <div key={i} style={{ height: i === 1 ? 28 : 16, width: `${w}px`, background: "#f3f4f6", borderRadius: 6, marginBottom: 16 }} />
      ))}
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, textAlign: "center", fontFamily: "Inter, sans-serif" }}>
      <p style={{ fontSize: 40 }}>😕</p>
      <p style={{ fontSize: 16, fontWeight: 600 }}>Scheme not found</p>
      <button onClick={() => router.back()} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", marginTop: 12 }}>Go back</button>
    </div>
  );

  const bt = BENEFIT_COLORS[scheme.benefit_type] || BENEFIT_COLORS.other;

  const formatAmount = () => {
    if (!scheme.benefit_amount) return null;
    const freq = scheme.benefit_frequency === "monthly" ? "/month"
               : scheme.benefit_frequency === "annual"  ? "/year"
               : scheme.benefit_frequency === "one-time" ? " one-time" : "";
    return `Rs.${scheme.benefit_amount.toLocaleString("en-IN")}${freq}`;
  };

  return (
    <div style={{ minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: "#f9fafb", fontFamily: "Inter, sans-serif", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 20px 24px", borderBottom: "1px solid #f3f4f6" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}>
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4, flex: 1 }}>{scheme.name}</h1>
          <span style={{ background: bt.bg, color: bt.color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{bt.label}</span>
        </div>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px" }}>{scheme.ministry}</p>
        {formatAmount() && (
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: "12px 16px", display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#1d4ed8" }}>{formatAmount()}</span>
            <span style={{ fontSize: 13, color: "#3b82f6" }}>benefit</span>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* Verified badge */}
        {scheme.verified_at && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✅</span>
            <span style={{ fontSize: 13, color: "#166534" }}>Verified — last checked {scheme.verified_at}</span>
          </div>
        )}

        {/* Deadline */}
        {scheme.application_deadline && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⏰</span>
            <span style={{ fontSize: 13, color: "#991b1b" }}>Deadline: {scheme.application_deadline}</span>
          </div>
        )}

        {/* myscheme.gov.in link */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: 20, marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Find more details</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>Search this scheme on the official government portal</p>
          <a
            href={`https://www.myscheme.gov.in/search?q=${encodeURIComponent(scheme.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#1a56db", color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none", boxSizing: "border-box" }}
          >
            🏛️ Search on myscheme.gov.in ↗
          </a>
        </div>

        {/* Eligibility criteria */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "4px 20px", marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "16px 0 4px" }}>Eligibility criteria</h2>
          {[
            ["States",     scheme.applicable_states ? scheme.applicable_states.join(", ") : "All India"],
            ["Gender",     scheme.gender ? scheme.gender.charAt(0).toUpperCase() + scheme.gender.slice(1) : "All"],
            ["Categories", scheme.caste_categories ? scheme.caste_categories.join(", ") : "All categories"],
            ["Age",        scheme.min_age && scheme.max_age ? `${scheme.min_age} – ${scheme.max_age} years` : scheme.min_age ? `${scheme.min_age}+ years` : scheme.max_age ? `Up to ${scheme.max_age} years` : "No restriction"],
            ["Max income", scheme.max_income ? `Rs.${scheme.max_income.toLocaleString("en-IN")}/year` : "No limit"],
            ["Occupation", scheme.occupation_types ? scheme.occupation_types.join(", ").replace(/_/g, " ") : "Any"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
              <span style={{ fontSize: 13, color: "#6b7280", flexShrink: 0, width: 110 }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#111827", textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Documents */}
        {scheme.documents_required && scheme.documents_required.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "16px 20px", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Documents needed</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scheme.documents_required.map((doc) => (
                <div key={doc} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{DOC_LABELS[doc] || doc.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply button */}
        {scheme.application_url && (
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: 20, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: "#6b7280" }}>Official application link</span>
              <span style={{ fontSize: 11, background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>✓ Verified</span>
            </div>
            <a href={scheme.application_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", width: "100%", background: "#2563eb", color: "#fff", borderRadius: 14, padding: "14px 20px", fontSize: 15, fontWeight: 600, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
              Apply Now — Official Site ↗
            </a>
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: "8px 0 0" }}>
              You will be taken to the official government website
            </p>
          </div>
        )}
      </div>
    </div>
  );
}