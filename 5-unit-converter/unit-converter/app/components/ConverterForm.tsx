import { useState } from "react";
import React from "react";
import { UnitType, units, styles } from "../consts/UnitType";
import { ConverterFormProps } from "../interfaces/ConverterFormProps";
import { convertLength, convertWeight, convertTemp } from "../utils/utils";

export function ConverterForm({ type }: ConverterFormProps): React.ReactElement {
  const [value, setValue] = useState<string>("");
  const [from, setFrom] = useState<string>(units[type][0]);
  const [to, setTo] = useState<string>(units[type][1]);
  const [result, setResult] = useState<number | null>(null);
  const [swapped, setSwapped] = useState<boolean>(false);

  const handleConvert = (): void => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    let res: number;
    if (type === "length") res = convertLength(num, from, to);
    else if (type === "weight") res = convertWeight(num, from, to);
    else res = convertTemp(num, from, to);
    setResult(res);
  };

  const handleSwap = (): void => {
    setFrom(to);
    setTo(from);
    setResult(null);
    setSwapped(!swapped);
  };

  const icons: Record<UnitType, string> = { length: "📏", weight: "⚖️", temperature: "🌡️" };

  return (
    <div style={styles.formCard}>
      <div style={styles.formIcon}>{icons[type]}</div>
      <div style={styles.inputRow}>
        <input
          type="number"
          placeholder="Enter value"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setValue(e.target.value); setResult(null); }}
          style={styles.input}
        />
      </div>
      <div style={styles.selectRow}>
        <div style={styles.selectGroup}>
          <label style={styles.label}>FROM</label>
          <select value={from} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFrom(e.target.value); setResult(null); }} style={styles.select}>
            {units[type].map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={handleSwap} style={styles.swapBtn} title="Swap units">
          <span style={{ display: "inline-block", transition: "transform 0.3s", transform: swapped ? "rotate(180deg)" : "rotate(0deg)" }}>⇄</span>
        </button>
        <div style={styles.selectGroup}>
          <label style={styles.label}>TO</label>
          <select value={to} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTo(e.target.value); setResult(null); }} style={styles.select}>
            {units[type].map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <button onClick={handleConvert} style={styles.convertBtn}>Convert</button>
      {result !== null && (
        <div style={styles.result}>
          <span style={styles.resultValue}>{result.toFixed(6).replace(/\.?0+$/, "")}</span>
          <span style={styles.resultUnit}> {to}</span>
          <div style={styles.resultFormula}>
            {value} {from} = {result.toFixed(6).replace(/\.?0+$/, "")} {to}
          </div>
        </div>
      )}
    </div>
  );
}

