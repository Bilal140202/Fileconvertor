export type UnitCategory = 'length' | 'weight' | 'temperature' | 'time' | 'volume';

export interface UnitDefinition {
  unit: string;
  category: UnitCategory;
  label: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const linear = (factorToBase: number) => ({
  toBase: (v: number) => v * factorToBase,
  fromBase: (v: number) => v / factorToBase
});

export const UNITS: UnitDefinition[] = [
  // length (base: meter)
  { unit: 'm', category: 'length', label: 'meter', ...linear(1) },
  { unit: 'km', category: 'length', label: 'kilometer', ...linear(1000) },
  { unit: 'cm', category: 'length', label: 'centimeter', ...linear(0.01) },
  { unit: 'mm', category: 'length', label: 'millimeter', ...linear(0.001) },
  { unit: 'in', category: 'length', label: 'inch', ...linear(0.0254) },
  { unit: 'ft', category: 'length', label: 'foot', ...linear(0.3048) },
  { unit: 'yd', category: 'length', label: 'yard', ...linear(0.9144) },
  { unit: 'mi', category: 'length', label: 'mile', ...linear(1609.344) },

  // weight (base: gram)
  { unit: 'g', category: 'weight', label: 'gram', ...linear(1) },
  { unit: 'kg', category: 'weight', label: 'kilogram', ...linear(1000) },
  { unit: 'oz', category: 'weight', label: 'ounce', ...linear(28.349523125) },
  { unit: 'lb', category: 'weight', label: 'pound', ...linear(453.59237) },

  // time (base: second)
  { unit: 's', category: 'time', label: 'second', ...linear(1) },
  { unit: 'min', category: 'time', label: 'minute', ...linear(60) },
  { unit: 'h', category: 'time', label: 'hour', ...linear(3600) },

  // volume (base: liter)
  { unit: 'l', category: 'volume', label: 'liter', ...linear(1) },
  { unit: 'ml', category: 'volume', label: 'milliliter', ...linear(0.001) },
  { unit: 'gal', category: 'volume', label: 'gallon (US)', ...linear(3.785411784) },

  // temperature (base: celsius)
  {
    unit: 'c',
    category: 'temperature',
    label: 'celsius',
    toBase: (v) => v,
    fromBase: (v) => v
  },
  {
    unit: 'f',
    category: 'temperature',
    label: 'fahrenheit',
    toBase: (v) => (v - 32) * (5 / 9),
    fromBase: (v) => v * (9 / 5) + 32
  },
  {
    unit: 'k',
    category: 'temperature',
    label: 'kelvin',
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15
  }
];

const unitByKey = new Map(UNITS.map((u) => [u.unit.toLowerCase(), u] as const));

export function getUnitCategories(): Record<UnitCategory, UnitDefinition[]> {
  const out: Record<UnitCategory, UnitDefinition[]> = {
    length: [],
    weight: [],
    temperature: [],
    time: [],
    volume: []
  };

  for (const u of UNITS) out[u.category].push(u);
  return out;
}

export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  const from = unitByKey.get(fromUnit.toLowerCase());
  const to = unitByKey.get(toUnit.toLowerCase());

  if (!from) throw new Error(`Unknown unit: ${fromUnit}`);
  if (!to) throw new Error(`Unknown unit: ${toUnit}`);
  if (from.category !== to.category) {
    throw new Error(`Incompatible unit categories: ${from.category} -> ${to.category}`);
  }

  const base = from.toBase(value);
  return to.fromBase(base);
}
