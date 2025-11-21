
import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { fetchSchedule, fetchEvents, initializeAndLoadData, getUniquePeriods } from './services/scheduleService';
import type { Schedule, Event, AulaEntry, EletivaEntry } from './types';
import ScheduleForm from './components/ScheduleForm';
import SpinnerIcon from './components/icons/SpinnerIcon';
import CalendarIcon from './components/icons/CalendarIcon';
import DataUploader from './components/DataUploader';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load display components for better performance
const ScheduleDisplay = lazy(() => import('./components/ScheduleDisplay'));
const EventDisplay = lazy(() => import('./components/EventDisplay'));

// Definição da interface para os dados retornados pelo upload
interface UploadData {
  aulasData: AulaEntry[];
  eventsData: Event[];
  eletivasData: EletivaEntry[];
  eventsSheetName?: string; 
}

const LAST_SEARCH_PERIODO_KEY = 'afya-last-periodo';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [allAulas, setAllAulas] = useState<AulaEntry[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  // allEletivas mantido para integridade do DataUploader, embora não usado na busca simplificada
  const [allEletivas, setAllEletivas] = useState<EletivaEntry[]>([]);

  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState<string>('');
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [events, setEvents] = useState<Event[] | null>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [view, setView] = useState<'schedule' | 'events'>('schedule');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Verifica o parâmetro da URL para ativar o modo de administrador
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Carrega os dados do localStorage ou de arquivos na inicialização
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const { aulas, events, eletivas } = await initializeAndLoadData();
            setAllAulas(aulas);
            setAllEvents(events);
            setAllEletivas(eletivas);
            
            if (aulas.length > 0) {
                const periods = getUniquePeriods(aulas);
                setAvailablePeriods(periods);
                
                // --- Lógica do Local Storage para persistir a última busca ---
                const savedPeriodo = localStorage.getItem(LAST_SEARCH_PERIODO_KEY);
                if (savedPeriodo && periods.includes(savedPeriodo)) {
                    setPeriodo(savedPeriodo);
                } else if (periods.length > 0) {
                    setPeriodo(periods[0]);
                }
            } else {
                 setError("Nenhum dado de aulas encontrado. Por favor, use o modo de administrador para carregar uma planilha.");
            }
        } catch (err) {
            console.error("Erro ao carregar dados iniciais:", err);
            const error = err as Error;
            setError(error.message || "Não foi possível carregar os dados. Tente atualizar a página.");
        } finally {
            setIsInitializing(false);
        }
    };
    
    loadInitialData();
  }, []);

  const handlePeriodoChange = (newPeriodo: string) => {
    setPeriodo(newPeriodo);
    setSchedule(null);
    setEvents(null);
    setSearched(false);
    setError(null);
    setView('schedule');
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSchedule(null);
    setEvents(null);
    setSearched(true);
    setView('schedule');

    try {
      const scheduleResult = fetchSchedule(periodo, allAulas);
      const eventsResult = fetchEvents(periodo, allEvents);

      setSchedule(scheduleResult);
      setEvents(eventsResult);

      // Salvar busca no localStorage
      localStorage.setItem(LAST_SEARCH_PERIODO_KEY, periodo);
      
    } catch (err) {
      console.error("Erro durante a busca:", err);
      const error = err as Error;
      setError(error.message || "Ocorreu um erro inesperado ao buscar o cronograma.");
    } finally {
      setIsLoading(false);
    }
  }, [periodo, allAulas, allEvents]);
  
  const handleUploadSuccess = (data: UploadData) => {
    setAllAulas(data.aulasData);
    setAllEvents(data.eventsData);
    setAllEletivas(data.eletivasData);
    // Força a recarga dos dados e re-renderização
    setPeriodo(''); // Reseta para acionar o useEffect de período
    setTimeout(() => {
        const periods = getUniquePeriods(data.aulasData);
        setAvailablePeriods(periods);
        if (periods.length > 0) {
            setPeriodo(periods[0]);
        }
    }, 0);
    setSchedule(null);
    setEvents(null);
    setSearched(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
          <SpinnerIcon className="w-12 h-12 mb-4" />
          <p className="text-xl font-semibold text-gray-200">Buscando cronograma...</p>
          <p className="text-gray-400 mt-1">Isso pode levar um momento.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
          <p className="text-xl font-semibold text-red-400">Ocorreu um Erro</p>
          <p className="text-md mt-2 text-gray-300">{error}</p>
        </div>
      );
    }
    
    if (!searched) {
      return (
        <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
          <CalendarIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-xl font-semibold text-gray-200">Seu cronograma está a um clique de distância.</p>
          <p className="text-md mt-1 text-gray-400">
            Selecione o período acima e clique em "Buscar Cronograma" para visualizar suas aulas e eventos.
          </p>
        </div>
      );
    }

    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
            <SpinnerIcon className="w-12 h-12 mb-4" />
            <p className="text-lg font-semibold text-gray-200">Carregando visualização...</p>
        </div>
      }>
        <div className="flex justify-center mb-6 space-x-2 bg-slate-800 p-1.5 rounded-full border border-slate-700 w-full max-w-sm mx-auto">
          <button
            onClick={() => setView('schedule')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${view === 'schedule' ? 'bg-afya-blue text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'}`}
            aria-current={view === 'schedule'}
          >
            Cronograma
          </button>
          <button
            onClick={() => setView('events')}
            disabled={!events || events.length === 0}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${view === 'events' ? 'bg-afya-pink text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-current={view === 'events'}
          >
            Eventos
          </button>
        </div>
        {view === 'schedule' ? (
            <ScheduleDisplay 
              schedule={schedule} 
              periodo={periodo}
            />
          ) : (
            <EventDisplay events={events} periodo={periodo} />
          )}
      </Suspense>
    );
  };

  if (isInitializing) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <SpinnerIcon className="w-16 h-16" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-300 font-sans">
        {/* Header */}
        <header className="relative text-white text-center shadow-lg overflow-hidden h-[450px] flex flex-col justify-end items-center">
             {/* Background Image and Overlay */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://cdn.prod.website-files.com/65b125bdd0407a7ed7dd8874/65b125bdd0407a7ed7dd8b9f_Medica-A-Gradu.png" 
                    alt="Profissionais de saúde em ambiente acadêmico" 
                    className="w-full h-full object-cover object-top" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
            </div>
            
            {/* Header Content */}
            <div className="relative z-10 container mx-auto px-4 mb-28">
                <img 
                    src="https://d9hhrg4mnvzow.cloudfront.net/institucional.afya.com.br/marca-e-cultura/1626d798-afya-faculdade-de-ciencias-medicas-branca-2_10ky04y0c004y000000000.png" 
                    alt="Logo Afya" 
                    className="h-28 mx-auto mb-4"
                />
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.6)' }}>
                    Faculdade de Ciências Médicas - Paraíba
                </h1>
                <p className="mt-3 text-sm md:text-base text-gray-200 max-w-2xl mx-auto" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.6)' }}>
                    Consulte seu cronograma de aulas e eventos.
                </p>
            </div>
        </header>

        <main className="relative p-4 md:p-8 -mt-24">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                  <div className="flex flex-col gap-8">
                      {/* Formulário de Busca (agora sempre no topo) */}
                      <div>
                          <ScheduleForm
                            periodo={periodo}
                            setPeriodo={handlePeriodoChange}
                            availablePeriods={availablePeriods}
                            onSearch={handleSearch}
                            isLoading={isLoading}
                          />
                          {isAdmin && (
                              <div className="mt-8">
                                  <DataUploader onUploadSuccess={handleUploadSuccess} />
                              </div>
                          )}
                      </div>
                      
                      {/* Conteúdo do Cronograma/Eventos (agora sempre abaixo) */}
                      <div>
                        {renderContent()}
                      </div>
                  </div>
              </ErrorBoundary>
            </div>
        </main>
        
        <footer className="text-center py-6 mt-8 border-t border-slate-700">
            <p className="text-sm text-gray-400">
                © 2025 Afya Paraíba. Todos os direitos reservados.
            </p>
        </footer>
    </div>
  );
};

export default App;
