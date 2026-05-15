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

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ height: 20, width: "60%", background: "#f3f4f6", borderRadius: 6 }} />
        <div style={{ height: 20, width: "20%", background: "#f3f4f6", borderRadius: 20 }} />
      </div>
      <div style={{ height: 14, width: "40%", background: "#f3f4f6", borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 36, background: "#f3f4f6", borderRadius: 10 }} />
    </div>
  );
}

function SchemeCard({ scheme, onClick }) {
  const bt = BENEFIT_COLORS[scheme.benefit_type] || BENEFIT_COLORS.other;
  const formatAmount = () => {
    if (!scheme.benefit_amount) return null;
    const freq = scheme.benefit_frequency === "monthly" ? "/month"
               : scheme.benefit_frequency === "annual"  ? "/year"
               : scheme.benefit_frequency === "one-time" ? " one-time" : "";
    return `Rs.${scheme.benefit_amount.toLocaleString("en-IN")}${freq}`;
  };
  return (
    <div onClick={onClick}
      style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: 20, marginBottom: 12, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0, flex: 1, paddingRight: 12, lineHeight: 1.4 }}>{scheme.name}</h3>
        <span style={{ background: bt.bg, color: bt.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{bt.label}</span>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>{scheme.ministry}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {formatAmount()
          ? <span style={{ fontSize: 16, fontWeight: 700, color: "#2563eb" }}>{formatAmount()}</span>
          : <span style={{ fontSize: 13, color: "#9ca3af" }}>Amount varies</span>}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scheme.is_rolling && !scheme.application_deadline && (
            <span style={{ fontSize: 12, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: 6 }}>Open now</span>
          )}
          <span style={{ color: "#9ca3af", fontSize: 18 }}>›</span>
        </div>
      </div>
    </div>
  );
}

export default function SchemesPage() {
  const router = useRouter();
  const [schemes,  setSchemes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [filter,   setFilter]   = useState("all");

  useEffect(() => {
    const raw = localStorage.getItem("user_profile");
    if (!raw) { router.push("/onboarding"); return; }
    const p = JSON.parse(raw);
    setProfile(p);
    fetchSchemes(p);
  }, []);

  const fetchSchemes = async (p) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/schemes/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_profile: p, language: "en" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setSchemes(data.schemes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const FILTERS = ["all", "cash_transfer", "scholarship", "subsidy", "insurance", "housing"];
  const filtered = filter === "all" ? schemes : schemes.filter((s) => s.benefit_type === filter);

  return (
    <div style={{ minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>

      <div style={{ background: "#fff", padding: "20px 20px 0", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>Your Schemes</h1>
            {!loading && <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>{filtered.length} matched</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/search")}
              style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              🔍 Search
            </button>
            <button onClick={() => profile && fetchSchemes(profile)}
              style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Refresh
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, background: filter === f ? "#2563eb" : "#f3f4f6", color: filter === f ? "#fff" : "#374151" }}>
              {f === "all" ? "All" : (BENEFIT_COLORS[f]?.label || f)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 100px" }}>
        {loading && [1,2,3,4].map((i) => <SkeletonCard key={i} />)}

        {error && !loading && (
          <div style={{ background: "#fff", border: "1px solid #fee2e2", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#991b1b", margin: "0 0 4px" }}>Could not load schemes</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>{error}</p>
            <button onClick={() => profile && fetchSchemes(profile)}
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>No schemes found</p>
            <button onClick={() => filter !== "all" ? setFilter("all") : router.push("/profile")}
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
              {filter !== "all" ? "Show all" : "Update profile"}
            </button>
          </div>
        )}

        {!loading && !error && filtered.map((scheme) => (
          <SchemeCard key={scheme.scheme_id} scheme={scheme}
            onClick={() => router.push(`/schemes/${scheme.scheme_id}`)} />
        ))}

        {profile && !loading && (
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "12px 16px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>{profile.state} · {profile.caste_category} · Age {profile.age}</span>
            <button onClick={() => router.push("/profile")}
              style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}