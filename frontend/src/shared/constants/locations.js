// Catalogos de ubicacion en cascada: Pais -> Estados -> Municipios.
// Reutilizado por Sucursales (Indigo) y Domicilio fiscal (Optica).
//
import MEXICO_LOCATIONS from "./mexicoLocations.json";

const LOCATIONS_BY_COUNTRY = {
  "México": MEXICO_LOCATIONS,
};

export const COUNTRIES = Object.keys(LOCATIONS_BY_COUNTRY).map((name) => ({
  value: name,
  label: name,
}));

export function getStatesForCountry(country) {
  const states = LOCATIONS_BY_COUNTRY[country];
  if (!states) return [];
  return Object.keys(states).map((name) => ({ value: name, label: name }));
}

export function getMunicipalitiesForState(country, state) {
  const states = LOCATIONS_BY_COUNTRY[country];
  const municipalities = states?.[state];
  if (!municipalities) return [];
  return municipalities.map((name) => ({ value: name, label: name }));
}

// Se mantiene por compatibilidad con el Domicilio fiscal de Optica, que
// hoy solo necesita la lista plana de estados (no depende del pais).
export const MEXICAN_STATES = getStatesForCountry("México");
