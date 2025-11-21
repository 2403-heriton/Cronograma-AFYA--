
import type { AulaEntry, Event, EletivaEntry } from '../types';

// Dados padrão para fallback, garantindo que o aplicativo funcione offline na primeira inicialização.
export const defaultAulas: AulaEntry[] = [
  {
    "periodo": "1º Período",
    "modulo": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "grupo": "GRUPO - A",
    "dia_semana": "Segunda-feira",
    "disciplina": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "sala": "APG A",
    "horario_inicio": "08:00",
    "horario_fim": "10:45",
    "tipo": "Prática",
    "professor": "Dr. House",
    "observacao": "Trazer material de laboratório."
  },
  {
    "periodo": "1º Período",
    "modulo": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "grupo": "GRUPO - A",
    "dia_semana": "Quinta-feira",
    "disciplina": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "sala": "APG A",
    "horario_inicio": "08:00",
    "horario_fim": "10:45",
    "tipo": "Teórica",
    "professor": "Dr. House",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "grupo": "GRUPO - A",
    "dia_semana": "Segunda-feira",
    "disciplina": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "sala": "LABORATÓRIO",
    "horario_inicio": "13:00",
    "horario_fim": "18:00",
    "tipo": "Simulação",
    "professor": "Dra. Grey",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "grupo": "GRUPO - A",
    "dia_semana": "Quarta-feira",
    "disciplina": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "sala": "AUDITÓRIO",
    "horario_inicio": "08:00",
    "horario_fim": "09:40",
    "tipo": "Simulação",
    "professor": "Dr. House",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "grupo": "GRUPO - B",
    "dia_semana": "Segunda-feira",
    "disciplina": "SISTEMAS ORGÂNICOS INTEGRADOS I",
    "sala": "APG B",
    "horario_inicio": "08:00",
    "horario_fim": "10:45",
    "tipo": "Simulação",
    "professor": "Dr. Wilson",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 1",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 02",
    "horario_inicio": "08:00",
    "horario_fim": "09:40",
    "tipo": "Simulação",
    "professor": "Dr. Smith",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 2",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 02",
    "horario_inicio": "08:00",
    "horario_fim": "09:40",
    "tipo": "Simulação",
    "professor": "Dr. Smith",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 3",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 03",
    "horario_inicio": "08:00",
    "horario_fim": "09:40",
    "tipo": "Simulação",
    "professor": "Dr. Smith",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 4",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 03",
    "horario_inicio": "08:00",
    "horario_fim": "09:40",
    "tipo": "Simulação",
    "professor": "Dr. Smith",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 5",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 02",
    "horario_inicio": "09:40",
    "horario_fim": "11:20",
    "tipo": "Simulação",
    "professor": "Dra. Yang",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 6",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 02",
    "horario_inicio": "09:40",
    "horario_fim": "11:20",
    "tipo": "Simulação",
    "professor": "Dra. Yang",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 7",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 03",
    "horario_inicio": "09:40",
    "horario_fim": "11:20",
    "tipo": "Prática",
    "professor": "Dra. Yang",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "grupo": "GRUPO - 8",
    "dia_semana": "Terça-feira",
    "disciplina": "PRÁTICAS INTERDISCIPLINARES DE EXTENSÃO, PESQUISA E ENSINO I",
    "sala": "SALA 03",
    "horario_inicio": "09:40",
    "horario_fim": "11:20",
    "tipo": "Prática",
    "professor": "Dra. Yang",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - A",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 06",
    "horario_inicio": "13:00",
    "horario_fim": "14:40",
    "tipo": "Prática",
    "professor": "Dr. Foreman",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - A",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 03",
    "horario_inicio": "14:50",
    "horario_fim": "16:30",
    "tipo": "Prática",
    "professor": "Dr. Foreman",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - B",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 06",
    "horario_inicio": "13:00",
    "horario_fim": "14:40",
    "tipo": "Prática",
    "professor": "Dr. Foreman",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - B",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 04",
    "horario_inicio": "14:50",
    "horario_fim": "16:30",
    "tipo": "Prática",
    "professor": "Dr. Foreman",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - C",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 06",
    "horario_inicio": "13:00",
    "horario_fim": "14:40",
    "tipo": "Teórica",
    "professor": "Dr. Chase",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - C",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 03",
    "horario_inicio": "14:50",
    "horario_fim": "16:30",
    "tipo": "Teórica",
    "professor": "Dr. Chase",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - D",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 06",
    "horario_inicio": "13:00",
    "horario_fim": "14:40",
    "tipo": "Teórica",
    "professor": "Dr. Chase",
    "observacao": ""
  },
  {
    "periodo": "1º Período",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - D",
    "dia_semana": "Quinta-feira",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "sala": "SALA 04",
    "horario_inicio": "14:50",
    "horario_fim": "16:30",
    "tipo": "Teórica",
    "professor": "Dr. Chase",
    "observacao": ""
  }
];


export const defaultEvents: Event[] = [
  {
    "periodo": "1º Período",
    "data": "20/12/2025",
    "data_fim": "22/12/2025",
    "horario": "18:00",
    "disciplina": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "tipo": "Semana de Palestras",
    "local": "Auditório",
    "modulo": "MÉTODOS CIENTÍFICOS EM MEDICINA I",
    "grupo": "GRUPO - B"
  },
  {
    "periodo": "Geral",
    "data": "21/12/2025",
    "horario": "19:00",
    "disciplina": "Fire Circus",
    "tipo": "MasterClass",
    "local": "Auditório multiuso",
    "modulo": "-",
    "grupo": "Geral"
  }
];

export const defaultEletivas: EletivaEntry[] = [
  {
    "disciplina": "LIBRAS",
    "dia_semana": "Sexta-feira",
    "horario_inicio": "13:00",
    "horario_fim": "14:40",
    "professor": "Prof. Eletiva 1",
    "sala": "Sala Eletiva 1",
    "tipo": "Teórica"
  },
  {
    "disciplina": "Medicina e Arte",
    "dia_semana": "Sexta-feira",
    "horario_inicio": "15:00",
    "horario_fim": "16:40",
    "professor": "Prof. Eletiva 2",
    "sala": "Sala Eletiva 2",
    "tipo": "Prática"
  }
];
