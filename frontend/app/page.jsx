"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LANGS = [
  { code: "en", label: "English", tagline: "Find government schemes you are eligible for", cta: "Get Started — Free", ctaSchemes: "See My Schemes", ctaProfile: "Update My Profile", speak: "Speak to find schemes", speakHint: "Tap mic and speak your details" },
  { code: "ta", label: "தமிழ்",   tagline: "நீங்கள் தகுதியான திட்டங்களை கண்டறியுங்கள்", cta: "தொடங்குங்கள் — இலவசம்", ctaSchemes: "என் திட்டங்களை பாருங்கள்", ctaProfile: "விவரங்களை மாற்றுங்கள்", speak: "பேசி திட்டங்கள் கண்டறியுங்கள்", speakHint: "மைக்கை தட்டி பேசுங்கள்" },
  { code: "hi", label: "हिंदी",   tagline: "अपने लिए योग्य सरकारी योजनाएं खोजें", cta: "शुरू करें — मुफ़्त", ctaSchemes: "मेरी योजनाएं देखें", ctaProfile: "प्रोफाइल अपडेट करें", speak: "बोलकर योजनाएं खोजें", speakHint: "माइक दबाएं और बोलें" },
];

const SPEECH_LANGS = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

const KEYWORD_MAP = {
  "tamil nadu": "TN", "tamilnadu": "TN", "தமிழ்நாடு": "TN", "தமிழ் நாடு": "TN",
  "maharashtra": "MH", "महाराष्ट्र": "MH", "delhi": "DL", "दिल्ली": "DL",
  "karnataka": "KA", "கர்நாடகா": "KA", "कर्नाटक": "KA",
  "andhra": "AP", "ஆந்திரா": "AP", "kerala": "KL", "கேரளா": "KL",
  "uttar pradesh": "UP", "उत्तर प्रदेश": "UP", "west bengal": "WB",
  "female": "female", "woman": "female", "women": "female",
  "பெண்": "female", "பெண்கள்": "female", "அம்மா": "female",
  "महिला": "female", "औरत": "female",
  "male": "male", "man": "male", "ஆண்": "male", "पुरुष": "male",
  "sc": "SC", "scheduled caste": "SC", "தலித்": "SC", "दलित": "SC",
  "st": "ST", "tribal": "ST", "பழங்குடி": "ST", "आदिवासी": "ST",
  "obc": "OBC", "பிற்படுத்தப்பட்ட": "OBC", "पिछड़ा": "OBC",
  "ews": "EWS", "general": "GEN", "பொது": "GEN", "सामान्य": "GEN",
  "farmer": "farmer", "விவசாயி": "farmer", "கிசான்": "farmer", "किसान": "farmer",
  "student": "student", "மாணவர்": "student", "छात्र": "student",
  "labour": "unorganised_worker", "daily wage": "unorganised_worker",
  "கூலி": "unorganised_worker", "மजदूर": "unorganised_worker", "मजदूर": "unorganised_worker",
  "self employed": "self_employed", "சுயதொழில்": "self_employed", "व्यवसाय": "self_employed",
  "unemployed": "unemployed", "வேலை இல்லை": "unemployed", "बेरोजगार": "unemployed",
  "salaried": "salaried", "job": "salaried", "நौகரி": "salaried", "नौकरी": "salaried",
};

const INCOME_KEYWORDS = {
  "poor": 60000, "ஏழை": 60000, "गरीब": 60000, "bpl": 60000,
  "low income": 120000, "குறைந்த வருமானம்": 120000, "कम आय": 120000,
  "middle": 250000, "நடுத்தர": 250000, "मध्यम": 250000,
};

function extractProfile(text) {
  const lower = text.toLowerCase();
  const profile = {
    state: "TN", gender: "female", caste_category: "OBC",
    age: 30, income_annual: 120000, occupation_type: "unorganised_worker",
  };
  for (const [kw, val] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw.toLowerCase()) || text.includes(kw)) {
      if (["TN","MH","DL","KA","AP","KL","UP","WB"].includes(val)) profile.state = val;
      else if (["male","female","other"].includes(val)) profile.gender = val;
      else if (["SC","ST","OBC","EWS","GEN"].includes(val)) profile.caste_category = val;
      else if (["farmer","student","unorganised_worker","self_employed","unemployed","salaried"].includes(val)) profile.occupation_type = val;
    }
  }
  for (const [kw, val] of Object.entries(INCOME_KEYWORDS)) {
    if (lower.includes(kw.toLowerCase()) || text.includes(kw)) profile.income_annual = val;
  }
  const ageMatch = text.match(/(\d{1,3})\s*(years|வயது|साल|yrs)/i) || text.match(/(வயது|साल)\s*(\d{1,3})/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1] || ageMatch[2]);
    if (age > 0 && age < 120) profile.age = age;
  }
  return profile;
}

export default function HomePage() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);
  const [lang, setLang]             = useState("en");
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [searching, setSearching]   = useState(false);
  const [voiceResults, setVoiceResults] = useState(null);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem("user_profile")) setHasProfile(true);
  }, []);

  const t = LANGS.find((l) => l.code === lang);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice not supported. Use Chrome browser.");
      return;
    }
    setVoiceError("");
    setTranscript("");
    setVoiceResults(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LANGS[lang] || "en-IN";

    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => setListening(false);

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) {
        searchFromSpeech(text);
      }
    };

    recognition.onerror = (e) => {
      setListening(false);
      setVoiceError("Could not hear clearly. Please try again.");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  const searchFromSpeech = async (text) => {
    setSearching(true);
    const profile = extractProfile(text);
    try {
      const res = await fetch(`${API_URL}/schemes/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_profile: profile, language: lang }),
      });
      const data = await res.json();
      setVoiceResults({ schemes: data.schemes || [], profile });
    } catch {
      setVoiceError("Could not connect to server.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: "#fff", padding: "40px 24px 32px", fontFamily: "Inter, sans-serif" }}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 20 }}>

        <div style={{ width: 80, height: 80, borderRadius: 20, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏛️</div>

        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>Welfare Schemes</h1>
          <p style={{ color: "#6b7280", fontSize: 16, margin: 0, lineHeight: 1.6 }}>{t.tagline}</p>
        </div>

        {/* Language switcher */}
        <div style={{ display: "flex", gap: 8 }}>
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)}
              style={{ padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: lang === l.code ? "#2563eb" : "#f3f4f6", color: lang === l.code ? "#fff" : "#374151" }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Trust box */}
        <div style={{ width: "100%", background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 16, padding: "16px 20px", textAlign: "left" }}>
          <p style={{ color: "#166534", fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>✅ Safe & Verified</p>
          <ul style={{ color: "#15803d", fontSize: 14, margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            <li>• We never ask for Aadhaar or bank details</li>
            <li>• All links go to official government sites</li>
            <li>• Your data stays on your phone</li>
          </ul>
        </div>

        {/* Voice search section */}
        <div style={{ width: "100%", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 20, padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#6d28d9", margin: "0 0 4px" }}>🎤 {t.speak}</p>
          <p style={{ fontSize: 13, color: "#7c3aed", margin: "0 0 16px" }}>{t.speakHint}</p>

          {/* Mic button */}
          <button
            onClick={listening ? stopVoice : startVoice}
            style={{ width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer", background: listening ? "#dc2626" : "#7c3aed", color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: listening ? "0 0 0 8px rgba(220,38,38,0.2)" : "0 4px 16px rgba(124,58,237,0.3)", transition: "all 0.2s" }}>
            {listening ? "⏹" : "🎤"}
          </button>

          {listening && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>Listening...</span>
            </div>
          )}

          {transcript && (
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #e9d5ff" }}>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, fontStyle: "italic" }}>"{transcript}"</p>
            </div>
          )}

          {searching && (
            <p style={{ fontSize: 13, color: "#7c3aed", textAlign: "center", margin: 0 }}>Finding schemes...</p>
          )}

          {voiceError && (
            <p style={{ fontSize: 13, color: "#dc2626", textAlign: "center", margin: 0 }}>{voiceError}</p>
          )}

          {/* Voice results */}
          {voiceResults && !searching && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 8px" }}>
                Found {voiceResults.schemes.length} scheme{voiceResults.schemes.length !== 1 ? "s" : ""} for {voiceResults.profile.state} · {voiceResults.profile.caste_category} · {voiceResults.profile.occupation_type.replace(/_/g, " ")}
              </p>
              {voiceResults.schemes.slice(0, 3).map((s) => (
                <div key={s.scheme_id}
                  onClick={() => router.push(`/schemes/${s.scheme_id}`)}
                  style={{ background: "#fff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "10px 14px", marginBottom: 6, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", flex: 1, paddingRight: 8 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "#7c3aed", whiteSpace: "nowrap" }}>›</span>
                </div>
              ))}
              {voiceResults.schemes.length > 3 && (
                <button
                  onClick={() => {
                    localStorage.setItem("user_profile", JSON.stringify(voiceResults.profile));
                    router.push("/schemes");
                  }}
                  style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 4 }}>
                  See all {voiceResults.schemes.length} schemes →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {hasProfile ? (
          <>
            <button onClick={() => router.push("/schemes")}
              style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
              {t.ctaSchemes}
            </button>
            <button onClick={() => router.push("/profile")}
              style={{ width: "100%", background: "#fff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
              {t.ctaProfile}
            </button>
          </>
        ) : (
          <button onClick={() => router.push("/onboarding")}
            style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            {t.cta}
          </button>
        )}
        <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, margin: 0 }}>Takes less than 1 minute • No sign up required</p>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}