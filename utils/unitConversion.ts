/**
 * Unit conversion utilities for height and weight
 * Supports Metric (kg, cm) and Imperial (lb, ft/in)
 */

export type UnitSystem = 'metric' | 'imperial';

// Weight conversions
const KG_TO_LB = 2.20462;
const LB_TO_KG = 0.453592;

// Height conversions
const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;
const IN_PER_FT = 12;

/**
 * Convert weight from kg to lb
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB);
}

/**
 * Convert weight from lb to kg
 */
export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 10) / 10; // Round to 1 decimal
}

/**
 * Convert height from cm to feet and inches
 * Returns an object with feet and inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm * CM_TO_IN);
  const feet = Math.floor(totalInches / IN_PER_FT);
  const inches = totalInches % IN_PER_FT;
  return { feet, inches };
}

/**
 * Convert height from feet and inches to cm
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * IN_PER_FT + inches;
  return Math.round(totalInches * IN_TO_CM);
}

/**
 * Format height for display based on unit system
 */
export function formatHeight(cm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${cm} cm`;
  } else {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
}

/**
 * Format weight for display based on unit system
 */
export function formatWeight(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${kg} kg`;
  } else {
    return `${kgToLb(kg)} lb`;
  }
}

/**
 * Get unit label for height
 */
export function getHeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'cm' : 'ft/in';
}

/**
 * Get unit label for weight
 */
export function getWeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'kg' : 'lb';
}
