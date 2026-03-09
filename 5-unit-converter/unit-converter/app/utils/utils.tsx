import { toBase } from "../consts/UnitType";

export function convertLength(value: number, from: string, to: string): number {
    return (value * toBase.length[from]) / toBase.length[to];
}

export function convertWeight(value: number, from: string, to: string): number {
    return (value * toBase.weight[from]) / toBase.weight[to];
}

export function convertTemp(value: number, from: string, to: string): number {
    let celsius: number;
    if (from === "Celsius") celsius = value;
    else if (from === "Fahrenheit") celsius = (value - 32) * 5 / 9;
    else celsius = value - 273.15;
    if (to === "Celsius") return celsius;
    if (to === "Fahrenheit") return celsius * 9 / 5 + 32;
    return celsius + 273.15;
}
