
export interface Aula {
  isFreeSlot?: boolean;
  horario: string;
  disciplina: string;
  sala: string;
  modulo: string;
  tipo?: string;
  professor?: string;
  events?: Event[];
  observacao?: string;
  grupo?: string;
  originalGroups?: string[]; // Stores the list of original groups before formatting
}

// Representa uma entrada de aula individual como está no aulas.json
export interface AulaEntry {
  periodo: string;
  modulo: string;
  grupo: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  disciplina: string;
  sala: string;
  tipo?: string;
  professor?: string;
  observacao?: string;
}

// Representa uma entrada de disciplina eletiva
export interface EletivaEntry {
  disciplina: string; // Mapeado da coluna 'modulo' na planilha de eletivas
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  professor?: string;
  sala: string;
  tipo?: string;
}

export interface DiaDeAula {
  dia: string;
  aulas: Aula[];
}

export type Schedule = DiaDeAula[];

export interface ModuleSelection {
  id: number;
  modulo: string;
  grupo: string;
}

export interface Event {
  periodo: string;
  data: string;
  data_fim?: string; // Adicionado para a data de término do evento
  horario: string;
  disciplina: string;
  tipo: string;
  local: string;
  modulo: string;
  grupo: string;
}

// FIX: Add global type declarations for jspdf and html2canvas to avoid redeclaration errors.
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: any) => any;
    };
  }
  const html2canvas: (
    element: HTMLElement,
    options?: any
  ) => Promise<HTMLCanvasElement>;
}
