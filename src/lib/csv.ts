// Parser de CSV + detección de columnas para importar clientes desde otras
// plataformas (AgendaPro, Reservo, Excel, etc.). Todo en el navegador.

export type ClientField = "name" | "email" | "phone" | "rut" | "notes";

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Detecta el separador más probable de la primera línea. */
function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/)[0] ?? "";
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = first.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

/** Parser tolerante: comillas, campos con el separador dentro, \r\n. */
export function parseCsv(text: string): ParsedCsv {
  text = text.replace(/^﻿/, ""); // quitar BOM
  const delim = detectDelimiter(text);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Filas realmente vacías fuera
  const clean = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (clean.length === 0) return { headers: [], rows: [] };
  return {
    headers: clean[0].map((h) => h.trim()),
    rows: clean.slice(1),
  };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar acentos
    .replace(/[^a-z0-9]/g, "");
}

// Nombres de columna reconocidos por campo (en español e inglés).
const ALIASES: Record<ClientField, string[]> = {
  name: ["nombre", "nombrecompleto", "nombreyapellido", "nombrecliente", "nombredelcliente", "cliente", "name", "fullname", "apellidoynombre"],
  email: ["correo", "correoelectronico", "email", "mail", "emailcliente", "correocliente", "e_mail"],
  phone: ["telefono", "fono", "celular", "movil", "numero", "numerodetelefono", "contacto", "whatsapp", "phone", "telefonocelular", "fonocliente", "tel"],
  rut: ["rut", "run", "dni", "documento", "cedula", "rutcliente", "identificacion"],
  notes: ["notas", "nota", "observaciones", "observacion", "comentarios", "comentario", "notes", "comment", "detalle"],
};

/**
 * Sugiere qué columna del CSV corresponde a cada campo. Devuelve el índice de
 * la columna (o -1). Asignación golosa: una columna no se usa dos veces.
 */
export function detectMapping(headers: string[]): Record<ClientField, number> {
  const normed = headers.map(norm);
  const used = new Set<number>();
  const result: Record<ClientField, number> = {
    name: -1,
    email: -1,
    phone: -1,
    rut: -1,
    notes: -1,
  };

  const fields: ClientField[] = ["name", "email", "phone", "rut", "notes"];
  for (const field of fields) {
    // 1º intento: coincidencia exacta
    let idx = normed.findIndex(
      (h, i) => !used.has(i) && ALIASES[field].includes(h)
    );
    // 2º intento: la columna contiene el alias (ej. "nombredelcliente")
    if (idx === -1) {
      idx = normed.findIndex(
        (h, i) =>
          !used.has(i) && ALIASES[field].some((a) => h.includes(a))
      );
    }
    if (idx !== -1) {
      result[field] = idx;
      used.add(idx);
    }
  }
  return result;
}
