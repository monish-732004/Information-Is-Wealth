"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATES = [
  ["AN","Andaman & Nicobar"],["AP","Andhra Pradesh"],["AR","Arunachal Pradesh"],
  ["AS","Assam"],["BR","Bihar"],["CG","Chhattisgarh"],["CH","Chandigarh"],
  ["DL","Delhi"],["GA","Goa"],["GJ","Gujarat"],["HP","Himachal Pradesh"],
  ["HR","Haryana"],["JH","Jharkhand"],["JK","Jammu & Kashmir"],
  ["KA","Karnataka"],["KL","Kerala"],["MH","Maharashtra"],["ML","Meghalaya"],
  ["MN","Manipur"],["MP","Madhya Pradesh"],["MZ","Mizoram"],["NL","Nagaland"],
  ["OD","Odisha"],["PB","Punjab"],["PY","Puducherry"],["RJ","Rajasthan"],
  ["SK","Sikkim"],["TN","Tamil Nadu"],["TR","Tripura"],["TS","Telangana"],
  ["UK","Uttarakhand"],["UP","Uttar Pradesh"],["WB","West Bengal"],
];

const OCCUPATIONS = [
  { value: "farmer",             label: "Farmer / Agriculture" },
  { value: "student",            label: "Student" },
  { value: "unorganised_worker", label: "Daily wage / Unorganised worker" },
  { value: "self_employed",      label: "Self-employed / Small business" },
  { value: "unemployed",         label: "Unemployed / Looking for work" },
  { value: "salaried",           label: "Salaried employee" },
];

const INCOME_RANGES = [
  { value: 60000,   label: "Below ₹60,000 / year" },
  { value: 120000,  label: "₹60,000 – ₹1,20,000" },
  { value: 180000,  label: "₹1,20,000 – ₹1,80,000" },
  { value: 250000,  label: "₹1,80,000 – ₹2,50,000" },
  { value: 500000,  label: "₹2,50,000 – ₹5,00,000" },
  { value: 1000000, label: "Above ₹5,00,000" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user_profile");
    if (!raw) { router.push("/onboarding"); return; }
    const p = JSON.parse(raw);
    setProfile(p);
    setForm(p);
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    const updated = { ...form, age: parseInt(form.age), income_annual: parseInt(form.income_annual) };
    localStorage.setItem("user_profile", JSON.stringify(updated));
    setProfile(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (confirm("Delete your profile? You will need to fill it in again.")) {
      localStorage.removeItem("user_profile");
      router.push("/");
    }
  };

  if (!profile) return null;

  const stateName    = STATES.find(([c]) => c === profile.state)?.[1] || profile.state;
  const occLabel     = OCCUPATIONS.find((o) => o.value === profile.occupation_type)?.label || profile.occupation_type;
  const incomeLabel  = INCOME_RANGES.find((r) => r.value === profile.income_annual)?.label || `₹${profile.income_annual}`;

  const btn = (active, onClick, children) => (
    <button onClick={onClick} style={{ padding: "10px 8px", borderRadius: 12, border: `1px solid ${active ? "#2563eb" : "#e5e7eb"}`, background: active ? "#2563eb" : "#fff", color: active ? "#fff" : "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}>
      {children}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: "#f9fafb", fontFamily: "Inter, sans-serif", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 14, cursor: "pointer" }}>← Back</button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>My Profile</h1>
        <button onClick={() => setEditing(!editing)} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div style={{ padding: 16 }}>

        {saved && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 12, color: "#166534", fontSize: 14, fontWeight: 500 }}>
            ✅ Profile saved!
          </div>
        )}

        {!editing ? (
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "4px 20px" }}>
            {[
              { label: "State",      value: stateName },
              { label: "Gender",     value: profile.gender },
              { label: "Category",   value: profile.caste_category },
              { label: "Age",        value: `${profile.age} years` },
              { label: "Income",     value: incomeLabel },
              { label: "Occupation", value: occLabel },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f9fafb" }}>
                <span style={{ fontSize: 14, color: "#6b7280" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#111827", textTransform: "capitalize" }}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>State</label>
              <select value={form.state} onChange={(e) => update("state", e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 15, background: "#fff" }}>
                {STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>Gender</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["male","female","other"].map((g) => btn(form.gender===g, () => update("gender",g), g))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>Category</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["SC","ST","OBC","EWS","GEN"].map((c) => btn(form.caste_category===c, () => update("caste_category",c), c))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>Age</label>
              <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} min="1" max="120"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 15, boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>Annual income</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {INCOME_RANGES.map((r) => (
                  <button key={r.value} onClick={() => update("income_annual", r.value)}
                    style={{ textAlign: "left", padding: "12px 16px", borderRadius: 12, border: `1px solid ${form.income_annual===r.value ? "#2563eb" : "#e5e7eb"}`, background: form.income_annual===r.value ? "#eff6ff" : "#fff", color: form.income_annual===r.value ? "#1d4ed8" : "#374151", fontSize: 14, cursor: "pointer", fontWeight: form.income_annual===r.value ? 500 : 400 }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>Occupation</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {OCCUPATIONS.map((o) => (
                  <button key={o.value} onClick={() => update("occupation_type", o.value)}
                    style={{ textAlign: "left", padding: "12px 16px", borderRadius: 12, border: `1px solid ${form.occupation_type===o.value ? "#2563eb" : "#e5e7eb"}`, background: form.occupation_type===o.value ? "#eff6ff" : "#fff", color: form.occupation_type===o.value ? "#1d4ed8" : "#374151", fontSize: 14, cursor: "pointer", fontWeight: form.occupation_type===o.value ? 500 : 400 }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delete */}
        <div style={{ marginTop: 20 }}>
          <button onClick={handleDelete}
            style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Delete my profile
          </button>
        </div>
      </div>

      {/* Save button */}
      {editing && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 16px 32px", background: "#fff", borderTop: "1px solid #f3f4f6" }}>
          <button onClick={handleSave}
            style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}