"use client"
import { useState } from "react";
import React from "react";

import { ConverterForm } from "./components/ConverterForm";
import { styles, tabLabels, tabs } from "./consts/UnitType";

import { UnitType } from "./consts/UnitType";

export default function App(): React.ReactElement {
  const [active, setActive] = useState<UnitType>("length");

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Unit<span style={styles.titleAccent}>Converter</span></h1>
        <p style={styles.subtitle}>Convert between units instantly</p>
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              style={{ ...styles.tab, ...(active === tab ? styles.tabActive : {}) }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <div style={styles.content}>
          <ConverterForm key={active} type={active} />
        </div>
      </div>
    </div>
  );
}