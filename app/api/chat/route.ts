import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function loadJson(filename: string): any {
  try {
    const filePath = path.join(process.cwd(), "public", filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
  } catch {
    return null;
  }
}

function flattenDoctors(source: any): string {
  if (!source?.departments) return "";
  const lines: string[] = [];
  for (const dept of source.departments) {
    for (const doc of dept.doctors || []) {
      lines.push(`- ${doc.name} | ${dept.department} | ${doc.hospital} | ${doc.qualification} ${doc.specialty || ""} | OPD: ${doc.opd_timing || "Confirm"}`);
    }
  }
  return lines.join("\n");
}

function flattenDiseases(common: any, additional: any): string {
  const lines: string[] = [];
  for (const d of common?.diseases || []) {
    lines.push(`- ${d.disease} | Dept: ${d.department} | Symptoms: ${(d.symptoms || []).join(", ")} | ${d.nepal_context || ""}`);
  }
  for (const dept of additional?.healthcare_departments || []) {
    for (const d of dept.common_diseases || []) {
      lines.push(`- ${d.disease_name} (${d.nepali_name || ""}) | Dept: ${dept.department_name} | Symptoms: ${(d.symptoms || []).join(", ")} | ${d.description || ""}`);
    }
  }
  return lines.join("\n");
}

function flattenTests(tests: any): string {
  if (!tests?.diseases_diagnostic_data) return "";
  const lines: string[] = [];
  for (const t of tests.diseases_diagnostic_data) {
    const testList = (t.required_diagnostic_tests || []).map((x: any) => `${x.test_name} (NPR ${x.cost_range_npr})`).join("; ");
    lines.push(`- ${t.disease_name} | Dept: ${t.department} | Tests: ${testList} | Total: NPR ${t.total_estimated_cost_npr} | Follow-up: ${t.average_follow_up_time || "Confirm"}`);
  }
  return lines.join("\n");
}

function buildDataContext(): string {
  const doctors = loadJson("gandaki_doctors.json");
  const additionalDocs = loadJson("additional_doctors.json");
  const common = loadJson("gandaki_common_diseases.json");
  const additional = loadJson("ADDITIONAL DISEASES.json");
  const tests = loadJson("TESTS AND COST.json");

  return `
## DOCTORS IN POKHARA
${flattenDoctors(doctors)}
${flattenDoctors(additionalDocs)}

## DISEASES AND SYMPTOMS
${flattenDiseases(common, additional)}

## DIAGNOSTIC TESTS AND COSTS (NPR)
${flattenTests(tests)}
`.trim();
}

async function fetchPatientHistory(accessToken: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: records } = await supabase
      .from("health_records")
      .select("*")
      .eq("patient_id", user.id)
      .order("visit_date", { ascending: false })
      .limit(20);

    const { data: vitals } = await supabase
      .from("vitals")
      .select("*")
      .eq("patient_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(10);

    const { data: prescriptions } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", user.id)
      .order("prescribed_at", { ascending: false })
      .limit(20);

    const { data: allergies } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("patient_id", user.id);

    const lines: string[] = [];

    if (profile) {
      lines.push(`## PATIENT PROFILE`);
      lines.push(`- Name: ${profile.name || "Unknown"}`);
      if (profile.blood_group) lines.push(`- Blood Group: ${profile.blood_group}`);
      if (profile.gender) lines.push(`- Gender: ${profile.gender}`);
      if (profile.date_of_birth) lines.push(`- Date of Birth: ${profile.date_of_birth}`);
      if (profile.address) lines.push(`- Address: ${profile.address}`);
      if (profile.phone) lines.push(`- Phone: ${profile.phone}`);
      lines.push("");
    }

    if (records?.length) {
      lines.push(`## PAST MEDICAL HISTORY`);
      for (const r of records) {
        lines.push(`- ${r.visit_date} | ${r.record_type || "visit"} | ${r.diagnosis || "No diagnosis"} | ${r.treatment || "No treatment"} | ${r.notes || ""} | Status: ${r.status || "completed"}`);
      }
      lines.push("");
    }

    if (vitals?.length) {
      lines.push(`## RECENT VITALS`);
      for (const v of vitals) {
        const parts: string[] = [];
        if (v.temperature) parts.push(`Temp: ${v.temperature}°C`);
        if (v.blood_pressure_systolic) parts.push(`BP: ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`);
        if (v.heart_rate) parts.push(`HR: ${v.heart_rate} bpm`);
        if (v.spo2) parts.push(`SpO2: ${v.spo2}%`);
        if (v.notes) parts.push(`Note: ${v.notes}`);
        lines.push(`- ${v.recorded_at?.split("T")[0] || "Unknown"} | ${parts.join(", ")}`);
      }
      lines.push("");
    }

    if (prescriptions?.length) {
      lines.push(`## CURRENT & PAST MEDICATIONS`);
      for (const p of prescriptions) {
        lines.push(`- ${p.medication_name} | ${p.dosage || ""} ${p.frequency || ""} | ${p.route || ""} | ${p.start_date || ""} to ${p.end_date || "ongoing"} | Status: ${p.status}`);
      }
      lines.push("");
    }

    if (allergies?.length) {
      lines.push(`## EMERGENCY CONTACTS`);
      for (const e of allergies) {
        lines.push(`- ${e.name} (${e.relationship || "N/A"}) | ${e.phone}${e.is_primary ? " [PRIMARY]" : ""}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  } catch (err) {
    console.error("Failed to fetch patient history:", err);
    return "";
  }
}

const BASE_SYSTEM_INSTRUCTION = `You are Swasthya AI, the healthcare assistant of Swasthya Sathi — a regional symptom guidance platform for Pokhara, Nepal.

## YOUR KNOWLEDGE BASE
You have access to real data about doctors, diseases, symptoms, and diagnostic costs in Pokhara. Use this data to answer patient questions accurately.

${buildDataContext()}

## RULES
- Your name is Swasthya AI. Never claim to be another assistant.
- You help patients understand symptoms, find the right department, and estimate diagnostic costs.
- When a patient describes symptoms, match them against the diseases above and suggest the most likely conditions.
- Always recommend the relevant department and suggest specific doctors from the directory when possible.
- Mention estimated diagnostic costs in NPR using the test data above.
- For emergencies (chest pain, breathing difficulty, heavy bleeding, loss of consciousness), immediately advise calling 102 (ambulance) or visiting the nearest emergency department.
- Be accurate, empathetic, and concise. Use simple language.
- Always recommend consulting a doctor for confirmation — you are not a replacement for professional medical advice.
- If unsure, say so honestly and recommend a general physician visit.
- Never prescribe medication or give dosage instructions.
- If asked for one word, respond with one word. If asked for one character, respond with one character.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, accessToken } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    let patientContext = "";
    if (accessToken) {
      patientContext = await fetchPatientHistory(accessToken);
    }

    const systemInstruction = patientContext
      ? `${BASE_SYSTEM_INSTRUCTION}\n\n## PATIENT'S MEDICAL HISTORY\nThe logged-in patient has the following medical records. Use this context to personalize your responses.\n\n${patientContext}`
      : BASE_SYSTEM_INSTRUCTION;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "I could not generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Swasthya AI chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response" },
      { status: 500 }
    );
  }
}
