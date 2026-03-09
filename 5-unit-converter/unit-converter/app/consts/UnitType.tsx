export type UnitType = "length" | "weight" | "temperature";

export const units: Record<UnitType, string[]> = {
    length: ["millimeter", "centimeter", "meter", "kilometer", "inch", "foot", "yard", "mile"],
    weight: ["milligram", "gram", "kilogram", "ounce", "pound"],
    temperature: ["Celsius", "Fahrenheit", "Kelvin"],
};

export const toBase: Record<"length" | "weight", Record<string, number>> = {
    length: { millimeter: 0.001, centimeter: 0.01, meter: 1, kilometer: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344 },
    weight: { milligram: 0.000001, gram: 0.001, kilogram: 1, ounce: 0.0283495, pound: 0.453592 },
};

export const tabs: UnitType[] = ["length", "weight", "temperature"];

export const tabLabels: Record<UnitType, string> = {
  length: "📏 Length",
  weight: "⚖️ Weight",
  temperature: "🌡️ Temperature",
};

export const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: "20px" },
    container: { width: "100%", maxWidth: "520px" },
    title: { textAlign: "center", fontSize: "2.8rem", fontWeight: "900", color: "#fff", margin: "0 0 4px", letterSpacing: "-1px" },
    titleAccent: { color: "#f9ca24", marginLeft: "10px" },
    subtitle: { textAlign: "center", color: "#aaa", fontSize: "0.95rem", margin: "0 0 28px", letterSpacing: "1px", textTransform: "uppercase" },
    tabs: { display: "flex", gap: "6px", marginBottom: "0", background: "rgba(255,255,255,0.05)", borderRadius: "14px 14px 0 0", padding: "8px 8px 0" },
    tab: { flex: 1, padding: "10px 6px", border: "none", background: "transparent", color: "#aaa", borderRadius: "10px 10px 0 0", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit", transition: "all 0.2s", fontWeight: "600" },
    tabActive: { background: "#fff", color: "#302b63", boxShadow: "0 -2px 10px rgba(0,0,0,0.2)" },
    content: { background: "#fff", borderRadius: "0 0 18px 18px", padding: "28px 24px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" },
    formCard: { display: "flex", flexDirection: "column", gap: "16px" },
    formIcon: { fontSize: "2.5rem", textAlign: "center" },
    inputRow: { display: "flex" },
    input: { width: "100%", padding: "12px 16px", border: "2px solid #e0e0e0", borderRadius: "10px", fontSize: "1.1rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
    selectRow: { display: "flex", alignItems: "flex-end", gap: "10px" },
    selectGroup: { flex: 1, display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "0.7rem", fontWeight: "800", letterSpacing: "1.5px", color: "#888", textTransform: "uppercase" },
    select: { padding: "10px 12px", border: "2px solid #e0e0e0", borderRadius: "10px", fontSize: "0.9rem", fontFamily: "inherit", outline: "none", background: "#fafafa", cursor: "pointer" },
    swapBtn: { padding: "10px 14px", background: "#302b63", color: "#f9ca24", border: "none", borderRadius: "10px", fontSize: "1.2rem", cursor: "pointer", flexShrink: 0 },
    convertBtn: { padding: "14px", background: "linear-gradient(135deg, #302b63, #24243e)", color: "#f9ca24", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: "800", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" },
    result: { background: "linear-gradient(135deg, #f9ca24, #f0932b)", borderRadius: "12px", padding: "18px", textAlign: "center" },
    resultValue: { fontSize: "2rem", fontWeight: "900", color: "#302b63" },
    resultUnit: { fontSize: "1.1rem", color: "#302b63", fontWeight: "600" },
    resultFormula: { marginTop: "6px", fontSize: "0.85rem", color: "rgba(48,43,99,0.7)", fontStyle: "italic" },
  };