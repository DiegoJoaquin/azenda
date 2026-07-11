// Presets por rubro: al elegir su rubro en el onboarding, el negocio parte
// con servicios típicos (duración y precio sugeridos) que solo ajusta.
// La agenda y la disponibilidad se adaptan solas a estas duraciones.

import type { Vertical } from "./types";

export interface ServicePreset {
  name: string;
  description: string;
  durationMin: number;
  priceClp: number;
  bufferAfterMin: number;
}

export interface CategoryPreset {
  category: string;
  services: ServicePreset[];
}

export const VERTICAL_PRESETS: Record<Vertical, CategoryPreset[]> = {
  peluqueria: [
    {
      category: "Cabello",
      services: [
        { name: "Corte mujer", description: "Lavado, corte y secado.", durationMin: 45, priceClp: 18000, bufferAfterMin: 10 },
        { name: "Corte hombre", description: "Corte con tijera o máquina.", durationMin: 30, priceClp: 12000, bufferAfterMin: 5 },
        { name: "Peinado de evento", description: "Peinado para ocasiones especiales.", durationMin: 60, priceClp: 25000, bufferAfterMin: 10 },
      ],
    },
    {
      category: "Color",
      services: [
        { name: "Coloración de raíz", description: "Retoque de raíz con tintura profesional.", durationMin: 90, priceClp: 45000, bufferAfterMin: 15 },
        { name: "Balayage", description: "Iluminación completa con matiz.", durationMin: 150, priceClp: 85000, bufferAfterMin: 15 },
      ],
    },
  ],
  barberia: [
    {
      category: "Barbería",
      services: [
        { name: "Corte de pelo", description: "Corte clásico o moderno.", durationMin: 30, priceClp: 12000, bufferAfterMin: 5 },
        { name: "Corte + barba", description: "Servicio completo.", durationMin: 50, priceClp: 18000, bufferAfterMin: 10 },
        { name: "Perfilado de barba", description: "Perfilado con navaja y toalla caliente.", durationMin: 20, priceClp: 8000, bufferAfterMin: 5 },
        { name: "Afeitado clásico", description: "Afeitado tradicional con navaja.", durationMin: 30, priceClp: 10000, bufferAfterMin: 5 },
      ],
    },
  ],
  spa_estetica: [
    {
      category: "Tratamientos",
      services: [
        { name: "Limpieza facial profunda", description: "Limpieza, exfoliación e hidratación.", durationMin: 60, priceClp: 30000, bufferAfterMin: 10 },
        { name: "Masaje descontracturante", description: "Masaje de espalda y cuello.", durationMin: 60, priceClp: 35000, bufferAfterMin: 10 },
        { name: "Manicure", description: "Manicure tradicional con esmaltado.", durationMin: 45, priceClp: 14000, bufferAfterMin: 5 },
        { name: "Depilación con cera", description: "Zona a elección.", durationMin: 30, priceClp: 12000, bufferAfterMin: 5 },
      ],
    },
  ],
  clinica_salud: [
    {
      category: "Consultas",
      services: [
        { name: "Consulta", description: "Consulta con el profesional.", durationMin: 30, priceClp: 25000, bufferAfterMin: 5 },
        { name: "Control", description: "Control de seguimiento.", durationMin: 20, priceClp: 15000, bufferAfterMin: 5 },
        { name: "Procedimiento", description: "Procedimiento en consulta.", durationMin: 60, priceClp: 45000, bufferAfterMin: 10 },
      ],
    },
  ],
  psicologia: [
    {
      category: "Sesiones",
      services: [
        { name: "Primera consulta", description: "Evaluación inicial.", durationMin: 60, priceClp: 45000, bufferAfterMin: 10 },
        { name: "Sesión individual", description: "Sesión de psicoterapia.", durationMin: 50, priceClp: 40000, bufferAfterMin: 10 },
        { name: "Sesión de pareja", description: "Terapia de pareja.", durationMin: 60, priceClp: 55000, bufferAfterMin: 10 },
      ],
    },
  ],
  fitness: [
    {
      category: "Entrenamiento",
      services: [
        { name: "Evaluación inicial", description: "Evaluación física y plan.", durationMin: 45, priceClp: 20000, bufferAfterMin: 5 },
        { name: "Sesión personal", description: "Entrenamiento uno a uno.", durationMin: 60, priceClp: 25000, bufferAfterMin: 10 },
      ],
    },
  ],
  generico: [
    {
      category: "Servicios",
      services: [
        { name: "Servicio estándar", description: "Atención estándar.", durationMin: 30, priceClp: 15000, bufferAfterMin: 5 },
        { name: "Servicio extendido", description: "Atención extendida.", durationMin: 60, priceClp: 25000, bufferAfterMin: 10 },
      ],
    },
  ],
};

/** Convierte un nombre en un slug válido para la URL del negocio. */
export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    // quitar tildes y diacríticos
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s.length >= 3 ? s : `${s}-negocio`.replace(/^-+/, "");
}
