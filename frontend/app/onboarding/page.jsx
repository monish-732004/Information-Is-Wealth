"use client";

import { useState } from "react";
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

const STEPS = [
  { title: "Where do you live?",     subtitle: "We use this to find schemes in your state" },
  { title: "Tell us about yourself", subtitle: "This helps us match the right schemes" },
  { title: "Your income & work",     subtitle: "Many schemes depend on income and occupation" },
  { title: "Almost done!",           subtitle: "Review your profile before we find your schemes" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    state: "", gender: "", caste_category: "",
    age: "", income_annual: "", occupation_type: "",
  });
  const [errors, setErrors] = useState({});

  const update = (key, value) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (step === 1 && !profile.state) e.state = "Please select your state";
    if (step === 2) {
      if (!profile.gender)         e.gender         = "Please select gender";
      if (!profile.caste_category) e.caste_category = "Please select category";
      if (!profile.age || profile.age < 1) e.age   = "Please enter a valid age";
    }
    if (step === 3) {
      if (!profile.income_annual)   e.income_annual   = "Please select income";
      if (!profile.occupation_type) e.occupation_type = "Please select occupation";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 4)); };

  const submit = () => {
    const final = { ...profile, age: parseInt(profile.age), income_annual: parseInt(profile.income_annual) };
    localStorage.setItem("user_profile", JSON.stringify(final));
    router.push("/schemes");
  };

  const s = STEPS[step - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: "#fff" }}>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#f3f4f6" }}>
        <div style={{ height: 4, background: "#2563eb", width: `${((step - 1) / 3) * 100}%`, transition: "width 0.4s" }} />
      </div>

      {/* Header */}
      <div style={{ padding: "24px 24px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          {step > 1
            ? <button onClick={() => setStep((s) => s - 1)} style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>← Back</button>
            : <span />}
          <span style={{ color: "#9ca3af", fontSize: 14 }}>{step} of 4</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>{s.title}</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>{s.subtitle}</p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "8px 24px 24px" }}>

        {step === 1 && (
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Select your state</label>
            <select value={profile.state} onChange={(e) => update("state", e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 16, background: "#fff" }}>
              <option value="">— Choose state —</option>
              {STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            {errors.state && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{errors.state}</p>}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Gender</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["male", "female", "other"].map((g) => (
                  <button key={g} onClick={() => update("gender", g)}
                    style={{ padding: "12px 8px", borderRadius: 12, border: `1px solid ${profile.gender === g ? "#2563eb" : "#e5e7eb"}`, background: profile.gender === g ? "#2563eb" : "#fff", color: profile.gender === g ? "#fff" : "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer", textTransform: "capitalize" }}>
                    {g}
                  </button>
                ))}
              </div>
              {errors.gender && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{errors.gender}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Category</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["SC", "ST", "OBC", "EWS", "GEN"].map((c) => (
                  <button key={c} onClick={() => update("caste_category", c)}
                    style={{ padding: "12px 8px", borderRadius: 12, border: `1px solid ${profile.caste_category === c ? "#2563eb" : "#e5e7eb"}`, background: profile.caste_category === c ? "#2563eb" : "#fff", color: profile.caste_category === c ? "#fff" : "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                    {c}
                  </button>
                ))}
              </div>
              {errors.caste_category && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{errors.caste_category}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Your age</label>
              <input type="number" value={profile.age} onChange={(e) => update("age", e.target.value)}
                placeholder="e.g. 28" min="1" max="120"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 16, boxSizing: "border-box" }} />
              {errors.age && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{errors.age}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Annual household income</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {INCOME_RANGES.map((r) => (
                  <button key={r.value} onClick={() => update("income_annual", r.value)}
                    style={{ textAlign: "left", padding: "12px 16px", borderRadius: 12, border: `1px solid ${profile.income_annual === r.value ? "#2563eb" : "#e5e7eb"}`, background: profile.income_annual === r.value ? "#eff6ff" : "#fff", color: profile.income_annual === r.value ? "#1d4ed8" : "#374151", fontSize: 14, cursor: "pointer", fontWeight: profile.income_annual === r.value ? 500 : 400 }}>
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.income_annual && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{errors.income_annual}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Occupation</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {OCCUPATIONS.map((o) => (
                  <button key={o.value} onClick={() => update("occupation_type", o.value)}
                    style={{ textAlign: "left", padding: "12px 16px", borderRadius: 12, border: `1px solid ${profile.occupation_type === o.value ? "#2563eb" : "#e5e7eb"}`, background: profile.occupation_type === o.value ? "#eff6ff" : "#fff", color: profile.occupation_type === o.value ? "#1d4ed8" : "#374151", fontSize: 14, cursor: "pointer", fontWeight: profile.occupation_type === o.value ? 500 : 400 }}>
                    {o.label}
                  </button>
                ))}
              </div>
              {errors.occupation_type && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{errors.occupation_type}</p>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "8px 20px" }}>
              {[
                { label: "State",      value: STATES.find(([c]) => c === profile.state)?.[1] },
                { label: "Gender",     value: profile.gender },
                { label: "Category",   value: profile.caste_category },
                { label: "Age",        value: `${profile.age} years` },
                { label: "Income",     value: INCOME_RANGES.find((r) => r.value === profile.income_annual)?.label },
                { label: "Occupation", value: OCCUPATIONS.find((o) => o.value === profile.occupation_type)?.label },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
                  <span style={{ color: "#6b7280", fontSize: 14 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 16, padding: "12px 16px" }}>
              <p style={{ color: "#166534", fontSize: 14, margin: 0 }}>✅ Your profile is saved only on your phone. We never upload it.</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "16px 24px 32px" }}>
        {step < 4
          ? <button onClick={next} style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Continue →</button>
          : <button onClick={submit} style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Find My Schemes 🎯</button>
        }
      </div>
    </div>
  );
}