// Capa de terminología por rubro.
// El modelo de datos es idéntico para todos los rubros: un "recurso
// reservable" (que en peluquerías es un profesional y en canchas es una
// cancha) con su horario, servicios y reservas. Esta capa solo cambia las
// PALABRAS que ve el usuario según el rubro, sin tocar la estructura.
// Extensible: agregar un rubro nuevo es agregar una entrada aquí.

import type { Vertical } from "./types";

export interface VerticalTerms {
  resource: string; // singular minúscula: "profesional" | "cancha"
  resources: string; // plural minúscula: "profesionales" | "canchas"
  ResourceCap: string; // singular capitalizado: "Profesional" | "Cancha"
  section: string; // nombre del módulo: "Equipo" | "Canchas"
  addResource: string; // "Agregar profesional" | "Agregar cancha"
  namePlaceholder: string; // placeholder del nombre
  titlePlaceholder: string; // placeholder del "cargo/tipo"
  defaultTitle: string; // título por defecto si se deja vacío
  chooseTitle: string; // título del paso de reserva
  chooseHint: string; // subtítulo del paso de reserva
  any: string; // "Cualquier profesional" | "Cualquier cancha disponible"
  anySub: string; // subtexto de la opción "cualquiera"
  withPrep: string; // "con" | "en" (para "con Martín" / "en Cancha 1")
  teamStep: string; // título del paso del onboarding
  teamHint: string; // subtítulo del paso del onboarding
  addAnother: string; // "Agregar otra persona" | "Agregar otra cancha"
  bookableLabel: string; // etiqueta de "reservable online"
}

const PEOPLE: VerticalTerms = {
  resource: "profesional",
  resources: "profesionales",
  ResourceCap: "Profesional",
  section: "Equipo",
  addResource: "Agregar profesional",
  namePlaceholder: "Nombre y apellido",
  titlePlaceholder: "Cargo (ej: Estilista)",
  defaultTitle: "Profesional",
  chooseTitle: "¿Con quién prefieres?",
  chooseHint:
    "Si no tienes preferencia, asignamos al primer profesional disponible.",
  any: "Cualquier profesional",
  anySub: "primera hora libre",
  withPrep: "con",
  teamStep: "Tu equipo",
  teamHint:
    "Quiénes atienden y en qué horario. Si trabajas solo, agrégate tú. Después podrás afinar horarios y servicios por persona.",
  addAnother: "Agregar otra persona",
  bookableLabel: "Reservable online",
};

const CANCHAS: VerticalTerms = {
  resource: "cancha",
  resources: "canchas",
  ResourceCap: "Cancha",
  section: "Canchas",
  addResource: "Agregar cancha",
  namePlaceholder: "Nombre (ej: Cancha 1)",
  titlePlaceholder: "Tipo (ej: Fútbol 7, techada)",
  defaultTitle: "Cancha",
  chooseTitle: "¿Qué cancha prefieres?",
  chooseHint:
    "Si te da lo mismo, te asignamos la primera cancha disponible.",
  any: "Cualquier cancha disponible",
  anySub: "la primera libre",
  withPrep: "en",
  teamStep: "Tus canchas",
  teamHint:
    "Agrega cada cancha con su horario. Puedes tener una techada, otra de fútbol 7, etc. Después ajustas horarios y arriendos por cancha.",
  addAnother: "Agregar otra cancha",
  bookableLabel: "Reservable online",
};

const MAP: Partial<Record<Vertical, VerticalTerms>> = {
  canchas: CANCHAS,
};

export function terms(v: Vertical): VerticalTerms {
  return MAP[v] ?? PEOPLE;
}

// Título y subtítulo del paso "elegir servicio" en la reserva, por rubro.
// ("¿Qué te vas a hacer?" calza en peluquería pero no en un spa o canchas.)
export const SERVICE_STEP: Record<Vertical, { title: string; hint: string }> = {
  peluqueria: { title: "¿Qué te vas a hacer?", hint: "Puedes elegir más de un servicio; se agendan seguidos." },
  barberia: { title: "¿Qué te vas a hacer?", hint: "Puedes elegir más de un servicio; se agendan seguidos." },
  spa_estetica: { title: "¿Qué tratamiento quieres?", hint: "Puedes elegir más de uno; se agendan seguidos." },
  clinica_salud: { title: "¿Qué necesitas agendar?", hint: "Puedes elegir más de un servicio; se agendan seguidos." },
  psicologia: { title: "¿Qué sesión quieres agendar?", hint: "Elige el tipo de sesión que necesitas." },
  fitness: { title: "¿Qué quieres reservar?", hint: "Puedes elegir más de una; se agendan seguidas." },
  canchas: { title: "¿Qué quieres arrendar?", hint: "Puedes elegir más de un arriendo; se agendan seguidos." },
  generico: { title: "¿Qué quieres reservar?", hint: "Puedes elegir más de un servicio; se agendan seguidos." },
};

// Ícono del módulo "Servicios" según el rubro (se muestra en la navegación).
export const SERVICES_ICON: Record<Vertical, string> = {
  peluqueria: "💇",
  barberia: "💈",
  spa_estetica: "🌿",
  clinica_salud: "🩺",
  psicologia: "🧠",
  fitness: "💪",
  canchas: "⚽",
  generico: "🛎️",
};
