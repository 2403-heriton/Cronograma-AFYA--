
import type { Schedule, DiaDeAula, ModuleSelection, Aula, Event, AulaEntry, EletivaEntry } from "../types";
import { defaultAulas, defaultEvents, defaultEletivas } from "./initialData";

// Permite o uso da biblioteca XLSX carregada via tag de script
declare var XLSX: any;

const AULAS_KEY = 'afya-schedule-aulas';
const EVENTS_KEY = 'afya-schedule-events';
const ELETIVAS_KEY = 'afya-schedule-eletivas';

// Helper to interpret dates in DD/MM/AAAA format safely
export const parseBrDate = (dateString: string): Date => {
  // Return a very early date if the string is invalid, so it doesn't crash and sorts predictably.
  if (!dateString || typeof dateString !== 'string') {
    return new Date(0);
  }
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return new Date(0);
  }
  const [day, month, year] = parts.map(Number);
  // Basic validation
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970 || month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date(0);
  }
  // The month is 0-indexed in the JS Date constructor
  const date = new Date(year, month - 1, day);
  // Check for invalid date creations (e.g., new Date('2024', 1, 30) for Feb 30)
  if (isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
};

// Helper to format Excel time values (serial numbers, Date objects, or strings) into HH:mm format.
const formatExcelTime = (value: any): string => {
    if (value instanceof Date) {
        // Usa getHours() e getMinutes() para evitar problemas de fuso horário,
        // garantindo que a hora seja lida como está na planilha.
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    if (typeof value === 'number') {
        // Fallback for when the value is a number but not parsed as a date.
        return XLSX.SSF.format('hh:mm', value);
    }
    // Fallback for values that are already strings or other types.
    return String(value ?? '').trim();
};

// Helper to format Excel date values (serial numbers, Date objects, or strings) into DD/MM/YYYY format.
const formatExcelDate = (value: any): string => {
    if (!value) return ''; // Retorna string vazia para valores nulos ou indefinidos
    if (value instanceof Date) {
        const day = String(value.getUTCDate()).padStart(2, '0');
        const month = String(value.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth is 0-indexed
        const year = value.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    if (typeof value === 'number') {
        // Fallback for when the value is a number but not parsed as a date.
        return XLSX.SSF.format('dd/mm/yyyy', value);
    }
    // Fallback for values that are already strings or other types.
    return String(value ?? '').trim();
};


// Normaliza o dia da semana para um formato padrão, tornando o sistema robusto a variações de entrada.
const normalizeDayOfWeek = (day: string): string => {
    if (!day) return '';
    const d = day.toLowerCase().replace(/[- ]/g, '').trim(); // Ex: "terça-feira" -> "terçafeira"
    if (d.startsWith('segunda')) return 'Segunda-feira';
    if (d.startsWith('terca') || d.startsWith('terça')) return 'Terça-feira';
    if (d.startsWith('quarta')) return 'Quarta-feira';
    if (d.startsWith('quinta')) return 'Quinta-feira';
    if (d.startsWith('sexta')) return 'Sexta-feira';
    if (d.startsWith('sabado') || d.startsWith('sábado')) return 'Sábado';
    if (d.startsWith('domingo')) return 'Domingo';
    return day; // Retorna o original se não houver correspondência
};

// Normaliza a string do período para apenas o número, tornando a correspondência robusta.
const normalizePeriodo = (periodo: string): string => {
    if (!periodo) return '';
    const match = String(periodo).match(/\d+/);
    if (match) {
        return match[0];
    }
    // Retorna a string em minúsculas se for algo como "Geral"
    return String(periodo).trim().toLowerCase();
}

// Função auxiliar para formatar a lista de grupos combinados
export const formatGroupLabel = (groups: string[]): string => {
    if (!groups || groups.length === 0) return "";
    
    // Remove duplicatas e valores vazios
    const uniqueGroups = [...new Set(groups)].filter(g => g.trim() !== '');
    if (uniqueGroups.length === 0) return "";
    if (uniqueGroups.length === 1) return uniqueGroups[0];

    // Função para limpar o nome do grupo para ordenação (ex: "GRUPO - A" -> "A")
    const clean = (g: string) => g.replace(/^(GRUPO|TURMA)(\s*[-–]\s*|\s+)/i, '').trim();

    // Mapeia para objetos com valor original e valor limpo
    const parsed = uniqueGroups.map(original => {
        const cleaned = clean(original);
        const num = parseInt(cleaned, 10);
        // Ensure it is a strictly numeric string (e.g. "1" not "1A")
        const isNum = !isNaN(num) && String(num) === cleaned;
        return {
            original,
            cleaned,
            isNum,
            valNum: isNum ? num : 0,
            valStr: cleaned
        };
    });

    const numeric = parsed.filter(p => p.isNum);
    // Check for single letters (A-Z)
    const alpha = parsed.filter(p => !p.isNum && p.cleaned.length === 1 && /^[a-zA-Z]$/.test(p.cleaned));
    const others = parsed.filter(p => !p.isNum && !(p.cleaned.length === 1 && /^[a-zA-Z]$/.test(p.cleaned)));

    const parts: string[] = [];

    const getRanges = (nums: number[]): string[] => {
        if (nums.length === 0) return [];
        const res: string[] = [];
        let start = nums[0];
        let prev = nums[0];
        
        for (let i = 1; i < nums.length; i++) {
            if (nums[i] === prev + 1) {
                prev = nums[i];
            } else {
                if (start === prev) res.push(`${start}`);
                else res.push(`${start} à ${prev}`);
                start = nums[i];
                prev = nums[i];
            }
        }
        if (start === prev) res.push(`${start}`);
        else res.push(`${start} à ${prev}`);
        return res;
    };

    // Process Alpha Ranges First (Usually Group A comes before Group 1 in lists)
    if (alpha.length > 0) {
        alpha.sort((a, b) => a.valStr.localeCompare(b.valStr));
        const codes = alpha.map(a => a.valStr.toUpperCase().charCodeAt(0));
        const ranges = getRanges(codes).map(r => {
             if (r.includes(' à ')) {
                 const [s, e] = r.split(' à ').map(Number);
                 return `${String.fromCharCode(s)} à ${String.fromCharCode(e)}`;
             }
             return String.fromCharCode(Number(r));
        });
        parts.push("Grupos " + ranges.join(", "));
    }

    // Process Numeric Ranges
    if (numeric.length > 0) {
        numeric.sort((a, b) => a.valNum - b.valNum);
        const ranges = getRanges(numeric.map(n => n.valNum));
        parts.push("Grupos " + ranges.join(", "));
    }
    
    // Process Others
    if (others.length > 0) {
        others.sort((a, b) => a.valStr.localeCompare(b.valStr));
        // Use original cleaned string
        parts.push("Grupos " + others.map(o => o.cleaned).join(", "));
    }

    return parts.join(" e ");
}


export const initializeAndLoadData = async (): Promise<{ aulas: AulaEntry[], events: Event[], eletivas: EletivaEntry[] }> => {
    let finalAulas: any[];
    let finalEvents: any[];
    let finalEletivas: any[];

    // --- Lógica de Carregamento em Cascata ---

    // 1. Tenta buscar da rede
    let networkAulas: any[] | null = null;
    let networkEvents: any[] | null = null;
    let networkEletivas: any[] | null = null;

    try {
        const cacheBuster = `?t=${Date.now()}`;
        const [aulasRes, eventosRes, avaliacoesRes, eletivasRes] = await Promise.all([
            fetch(`/aulas.json${cacheBuster}`),
            fetch(`/eventos.json${cacheBuster}`),
            fetch(`/avaliacoes.json${cacheBuster}`),
            fetch(`/eletivas.json${cacheBuster}`),
        ]);

        // Processa Aulas: só considera válido se a requisição for bem-sucedida E o array não for vazio.
        if (aulasRes.ok) {
            const data = await aulasRes.json();
            if (Array.isArray(data) && data.length > 0) {
                networkAulas = data;
            }
        }
        
        // Processa Eventos e Avaliações
        const combinedEvents: any[] = [];
        if (eventosRes.ok) {
            const data = await eventosRes.json();
            if (Array.isArray(data)) combinedEvents.push(...data);
        }
        if (avaliacoesRes.ok) {
            const data = await avaliacoesRes.json();
            if (Array.isArray(data)) combinedEvents.push(...data);
        }
        // Apenas considera os dados da rede válidos se eles não estiverem vazios.
        if (combinedEvents.length > 0) {
            networkEvents = combinedEvents;
        }

        // Processa Eletivas
        if (eletivasRes.ok) {
            const data = await eletivasRes.json();
            // Apenas considera os dados da rede válidos se eles não estiverem vazios.
            if (Array.isArray(data) && data.length > 0) {
                 networkEletivas = data;
            }
        }

    } catch (error) {
        console.warn("Falha na busca de dados da rede. Tentando fallback para o cache local.", error);
    }

    // 2. Decide a fonte de dados final para AULAS (fonte principal)
    if (networkAulas) {
        finalAulas = networkAulas;
        localStorage.setItem(AULAS_KEY, JSON.stringify(finalAulas));
    } else {
        try {
            const localData = localStorage.getItem(AULAS_KEY);
            const parsed = localData ? JSON.parse(localData) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
                finalAulas = parsed;
            } else {
                finalAulas = defaultAulas;
            }
        } catch (e) {
            localStorage.removeItem(AULAS_KEY); // Limpa cache corrompido
            finalAulas = defaultAulas;
        }
    }

    // 3. Decide a fonte final para EVENTOS
    if (networkEvents) {
        finalEvents = networkEvents;
        localStorage.setItem(EVENTS_KEY, JSON.stringify(finalEvents));
    } else {
        try {
            const localData = localStorage.getItem(EVENTS_KEY);
            const parsed = localData ? JSON.parse(localData) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
                finalEvents = parsed;
            } else {
                finalEvents = defaultEvents;
            }
        } catch (e) {
            localStorage.removeItem(EVENTS_KEY);
            finalEvents = defaultEvents;
        }
    }
    
    // 4. Decide a fonte final para ELETIVAS
     if (networkEletivas) {
        finalEletivas = networkEletivas;
        localStorage.setItem(ELETIVAS_KEY, JSON.stringify(finalEletivas));
    } else {
        try {
            const localData = localStorage.getItem(ELETIVAS_KEY);
            const parsed = localData ? JSON.parse(localData) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
                finalEletivas = parsed;
            } else {
                finalEletivas = defaultEletivas;
            }
        } catch (e) {
            localStorage.removeItem(ELETIVAS_KEY);
            finalEletivas = defaultEletivas;
        }
    }

    // --- Higienização dos Dados ---
    const aulas: AulaEntry[] = finalAulas.map((row: any) => {
        const obsKey = Object.keys(row).find(k => {
            const lowerK = k.toLowerCase().trim();
            return lowerK === 'observação' || lowerK === 'observacao' || lowerK === 'observações';
        });
        const observacaoValue = obsKey ? row[obsKey] : '';

        return {
            periodo: String(row.periodo ?? '').trim(),
            modulo: String(row.modulo ?? '').trim(),
            grupo: String(row.grupo ?? '').trim(),
            dia_semana: normalizeDayOfWeek(String(row.dia_semana ?? '').trim()),
            disciplina: String(row.disciplina ?? '').trim(),
            sala: String(row.sala ?? '').trim(),
            horario_inicio: String(row.horario_inicio ?? '').trim(),
            horario_fim: String(row.horario_fim ?? '').trim(),
            tipo: String(row.tipo ?? '').trim(),
            professor: String(row.professor ?? '').trim(),
            observacao: String(observacaoValue ?? '').trim(),
        };
    });
    
    const events: Event[] = finalEvents.map((row: any): Event => ({
        periodo: String(row.periodo ?? '').trim(),
        data: String(row.data ?? '').trim(),
        data_fim: String(row.data_fim ?? '').trim(),
        horario: String(row.horario ?? '').trim(),
        disciplina: String(row.disciplina ?? '').trim(),
        tipo: String(row.tipo ?? '').trim(),
        local: String(row.local ?? '').trim(),
        modulo: String(row.modulo ?? '').trim(),
        grupo: String(row.grupo ?? '').trim(),
    }));

    const eletivas: EletivaEntry[] = finalEletivas.map((row: any): EletivaEntry => ({
        disciplina: String(row.modulo ?? row.disciplina ?? '').trim(),
        dia_semana: normalizeDayOfWeek(String(row.dia_semana ?? '').trim()),
        horario_inicio: String(row.horario_inicio ?? '').trim(),
        horario_fim: String(row.horario_fim ?? '').trim(),
        professor: String(row.professor ?? '').trim(),
        sala: String(row.sala ?? '').trim(),
        tipo: String(row.tipo ?? '').trim(),
    }));

    return { aulas, events, eletivas };
}


const groupAulasIntoSchedule = (aulas: AulaEntry[]): Schedule => {
    const weekOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    const DAY_START_MINUTES = 8 * 60; // 08:00
    const DAY_END_MINUTES = 22 * 60; // 22:00

    const formatMinutes = (totalMinutes: number): string => {
        const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const minutes = (totalMinutes % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const parseMinutes = (timeStr: string): number => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    };

    // Agrupa por dia
    const aulasByDay = aulas.reduce<Record<string, AulaEntry[]>>((acc, aulaEntry) => {
        const dia = aulaEntry.dia_semana;
        if (!dia || !aulaEntry.disciplina || aulaEntry.disciplina.trim() === '') {
            return acc;
        }
        if (!acc[dia]) {
            acc[dia] = [];
        }
        acc[dia].push(aulaEntry);
        return acc;
    }, {});

    // Itera sobre os dias da semana para construir um cronograma completo.
    const finalSchedule: Schedule = weekOrder.map(dayName => {
        const dailyEntries = aulasByDay[dayName] || [];
        
        // --- Lógica de Agrupamento de Turmas ---
        // Mapa para agrupar aulas idênticas (mesma disciplina e horário)
        // A chave considera apenas Horário e Disciplina para mesclar grupos diferentes
        const groupedMap = new Map<string, { 
            horario_inicio: string;
            horario_fim: string;
            disciplina: string;
            groups: Set<string>;
            salas: Set<string>;
            professores: Set<string>;
            tipos: Set<string>;
            modulos: Set<string>;
            observacoes: Set<string>;
        }>();

        dailyEntries.forEach(entry => {
            // Chave unificada para agrupar todos os grupos que tenham a mesma aula no mesmo horário
            const key = `${entry.horario_inicio}|${entry.horario_fim}|${entry.disciplina}`;
            
            if (!groupedMap.has(key)) {
                groupedMap.set(key, { 
                    horario_inicio: entry.horario_inicio,
                    horario_fim: entry.horario_fim,
                    disciplina: entry.disciplina,
                    groups: new Set(),
                    salas: new Set(),
                    professores: new Set(),
                    tipos: new Set(),
                    modulos: new Set(),
                    observacoes: new Set()
                });
            }
            const groupData = groupedMap.get(key)!;
            if (entry.grupo) groupData.groups.add(entry.grupo);
            if (entry.sala) groupData.salas.add(entry.sala);
            if (entry.professor) groupData.professores.add(entry.professor);
            if (entry.tipo) groupData.tipos.add(entry.tipo);
            if (entry.modulo) groupData.modulos.add(entry.modulo);
            if (entry.observacao) groupData.observacoes.add(entry.observacao);
        });

        // Converte o mapa de volta para objetos de Aula e inclui metadados de tempo
        const mergedAulas = Array.from(groupedMap.values()).map((data) => {
             const groupArray = Array.from(data.groups);
             const formattedGroup = formatGroupLabel(groupArray);
             
             // Helper to join sets into a string with separator
             const joinSet = (set: Set<string>) => Array.from(set).filter(s => s.trim() !== '').join(' / ');

             return {
                horario: `${data.horario_inicio} - ${data.horario_fim}`,
                disciplina: data.disciplina,
                sala: joinSet(data.salas),
                modulo: joinSet(data.modulos),
                grupo: formattedGroup, // Usa o label formatado (ex: "Grupos A à D e Grupos 1 à 2")
                originalGroups: groupArray, // Stores raw groups for title formatting
                tipo: joinSet(data.tipos),
                professor: joinSet(data.professores),
                observacao: joinSet(data.observacoes),
                startMinutes: parseMinutes(data.horario_inicio),
                endMinutes: parseMinutes(data.horario_fim)
             };
        });

        const sortedAulas = mergedAulas
            .filter(aula => aula.startMinutes > 0 && aula.endMinutes > 0 && aula.endMinutes > aula.startMinutes)
            .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

        const dayScheduleWithGaps: Aula[] = [];
        let currentTime = DAY_START_MINUTES;

        // Adiciona os intervalos livres entre as aulas.
        for (const aula of sortedAulas) {
            if (aula.startMinutes > currentTime) {
                dayScheduleWithGaps.push({
                    isFreeSlot: true,
                    disciplina: 'Horário Livre',
                    horario: `${formatMinutes(currentTime)} - ${formatMinutes(aula.startMinutes)}`,
                    sala: '',
                    modulo: '',
                });
            }
            
            dayScheduleWithGaps.push(aula);
            // Ensure that with overlapping classes, we use the latest end time
            // to correctly calculate the next free slot.
            currentTime = Math.max(currentTime, aula.endMinutes);
        }

        // Adiciona o intervalo livre final, se houver, até o fim do dia.
        if (currentTime < DAY_END_MINUTES) {
            dayScheduleWithGaps.push({
                isFreeSlot: true,
                disciplina: 'Horário Livre',
                horario: `${formatMinutes(currentTime)} - ${formatMinutes(DAY_END_MINUTES)}`,
                sala: '',
                modulo: '',
            });
        }

        return {
            dia: dayName,
            aulas: dayScheduleWithGaps,
        };
    });
    
    return finalSchedule;
};


export const fetchSchedule = (
    periodo: string, 
    allAulas: AulaEntry[]
): Schedule | null => {
    const matchingAulas = allAulas.filter(aula => 
        String(aula.periodo) === String(periodo)
    );
    return groupAulasIntoSchedule(matchingAulas);
};

export const fetchEvents = (periodo: string, allEvents: Event[]): Event[] | null => {
    const normalizedSelectedPeriodo = normalizePeriodo(periodo);
    
    const matchingEvents = allEvents.filter(event => {
        const normalizedEventPeriodo = normalizePeriodo(event.periodo);
        
        // Evento é "Geral" se o período dele for 'geral'.
        const isGeneralEvent = normalizedEventPeriodo === 'geral';

        // Evento é específico do período se o período normalizado corresponder.
        const isPeriodMatch = normalizedEventPeriodo === normalizedSelectedPeriodo;

        return isGeneralEvent || isPeriodMatch;
    });

    if (matchingEvents.length === 0) return null;
    
    const uniqueEvents = matchingEvents.filter((event, index, self) =>
        index === self.findIndex((e) => (
            e.data === event.data && e.disciplina === event.disciplina && e.tipo === event.tipo && e.modulo === event.modulo
        ))
    );

    uniqueEvents.sort((a, b) => parseBrDate(a.data).getTime() - parseBrDate(b.data).getTime());

    return uniqueEvents;
};

export const getUniquePeriods = (allAulas: AulaEntry[]): string[] => {
    const periods = allAulas.map(entry => String(entry.periodo));
    const uniquePeriods = [...new Set(periods)];
    
    uniquePeriods.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });
    
    return uniquePeriods;
};

export const updateDataFromExcel = async (file: File): Promise<{ aulasData: AulaEntry[], eventsData: Event[], eletivasData: EletivaEntry[], eventsSheetName: string | undefined }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                
                const aulasSheet = workbook.Sheets['Aulas'];
                const eletivasSheet = workbook.Sheets['Eletivas'];
                const eventosSheetName = workbook.SheetNames.find(name => {
                    const lowerCaseName = name.toLowerCase().trim();
                    return lowerCaseName === 'eventos' || lowerCaseName === 'avaliações';
                });
                const eventosSheet = eventosSheetName ? workbook.Sheets[eventosSheetName] : undefined;

                if (!aulasSheet) {
                  return reject(new Error("Aba 'Aulas' não encontrada na planilha."));
                }
                
                // Processa as linhas com chaves case-insensitive
                const processRows = (sheet: any) => {
                    if (!sheet) return [];
                    const rawData = XLSX.utils.sheet_to_json(sheet);
                    return rawData.map((row: any) => {
                        const lowerCaseRow: { [key: string]: any } = {};
                        for (const key in row) {
                            lowerCaseRow[key.toLowerCase().trim()] = row[key];
                        }
                        return lowerCaseRow;
                    });
                };
                
                const processedAulasData = processRows(aulasSheet);
                
                const aulasData: AulaEntry[] = processedAulasData.map((row: any): AulaEntry => {
                    const observacaoValue = row['observação'] || row['observacao'] || row['observações'] || '';

                    return {
                        periodo: String(row['periodo'] ?? '').trim(),
                        modulo: String(row['modulo'] ?? '').trim(),
                        grupo: String(row['grupo'] ?? '').trim(),
                        dia_semana: normalizeDayOfWeek(String(row['dia_semana'] ?? '').trim()),
                        disciplina: String(row['disciplina'] ?? '').trim(),
                        sala: String(row['sala'] ?? '').trim(),
                        horario_inicio: formatExcelTime(row['horario_inicio']),
                        horario_fim: formatExcelTime(row['horario_fim']),
                        tipo: String(row['tipo'] ?? row['tipo de aula'] ?? '').trim(),
                        professor: String(row['professor'] ?? row['docente'] ?? '').trim(),
                        observacao: String(observacaoValue ?? '').trim(),
                    };
                });
                
                let eventsData: Event[] = [];
                if (eventosSheet) {
                    const processedEventsData = processRows(eventosSheet);
                    eventsData = processedEventsData.map((row: any): Event => ({
                        periodo: String(row['periodo'] ?? '').trim(),
                        data: formatExcelDate(row['data'] ?? row['data inicio']),
                        data_fim: formatExcelDate(row['data fim']),
                        horario: formatExcelTime(row['horario']),
                        disciplina: String(row['disciplina'] ?? '').trim(),
                        tipo: String(row['tipo'] ?? '').trim(),
                        local: String(row['local'] ?? '').trim(),
                        modulo: String(row['modulo'] ?? '').trim(),
                        grupo: String(row['grupo'] ?? '').trim(),
                    }));
                }
                
                let eletivasData: EletivaEntry[] = [];
                if (eletivasSheet) {
                    const processedEletivasData = processRows(eletivasSheet);
                    eletivasData = processedEletivasData.map((row: any): EletivaEntry => ({
                        disciplina: String(row['modulo'] ?? row['disciplina'] ?? '').trim(),
                        dia_semana: normalizeDayOfWeek(String(row['dia_semana'] ?? '').trim()),
                        sala: String(row['sala'] ?? '').trim(),
                        horario_inicio: formatExcelTime(row['horario_inicio']),
                        horario_fim: formatExcelTime(row['horario_fim']),
                        tipo: String(row['tipo'] ?? '').trim(),
                        professor: String(row['professor'] ?? row['docente'] ?? '').trim(),
                    }));
                }

                // Validação de cabeçalhos
                if (aulasData.length > 0 && (!aulasData[0].dia_semana || !aulasData[0].horario_inicio)) {
                    return reject(new Error("Formato incorreto na aba 'Aulas'. Verifique os cabeçalhos das colunas."));
                }
                if (eventosSheet && eventsData.length > 0 && (!eventsData[0].data || !eventsData[0].tipo)) {
                   return reject(new Error(`Formato incorreto na aba '${eventosSheetName}'. Verifique os cabeçalhos.`));
                }
                 if (eletivasSheet && eletivasData.length > 0 && (!eletivasData[0].disciplina || !eletivasData[0].dia_semana)) {
                   return reject(new Error("Formato incorreto na aba 'Eletivas'. Verifique os cabeçalhos."));
                }


                localStorage.setItem(AULAS_KEY, JSON.stringify(aulasData));
                if (eventsData.length > 0) {
                    localStorage.setItem(EVENTS_KEY, JSON.stringify(eventsData));
                }
                if (eletivasData.length > 0) {
                    localStorage.setItem(ELETIVAS_KEY, JSON.stringify(eletivasData));
                }

                resolve({ aulasData, eventsData, eletivasData, eventsSheetName: eventosSheetName });
            } catch (error) {
                console.error("Erro ao processar planilha:", error);
                reject(new Error('Falha ao ler o arquivo. Verifique se ele não está corrompido.'));
            }
        };
        reader.onerror = (error) => reject(new Error('Não foi possível ler o arquivo.'));
        reader.readAsArrayBuffer(file);
    });
};
