
import React, { useState } from 'react';
import type { Schedule, DiaDeAula, Aula } from '../types';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import NotFoundIcon from './icons/NotFoundIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import UserIcon from './icons/UserIcon';
import InfoIcon from './icons/InfoIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import CoffeeIcon from './icons/CoffeeIcon';
import BookIcon from './icons/BookIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { stringToColor } from '../services/colorService';
import { formatGroupLabel } from '../services/scheduleService';

// FIX: Removed redeclared global types for jspdf and html2canvas. These are now defined in types.ts.

// Componente de helper para exibir uma linha de informação com ícone
const AulaInfo: React.FC<{ icon: React.ReactNode; label: string; text: string }> = ({ icon, label, text }) => (
  <div className="flex items-start gap-2 text-sm">
    <span className="text-afya-pink flex-shrink-0 w-3 h-3 mt-0.5">{icon}</span>
    <div className="text-gray-400">
      <span className="font-semibold text-gray-200">{label}:</span> {text}
    </div>
  </div>
);

// Card de aula redesenhado com mais detalhes
const AulaCard: React.FC<{ aula: Aula }> = ({ aula }) => {
  const color = stringToColor(aula.disciplina);
  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700 border-l-4 aula-card"
      style={{ borderLeftColor: color }}
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <h4 className="font-semibold text-gray-100 text-base leading-tight">
          {aula.disciplina}
        </h4>
        <div className="flex flex-col items-end gap-1 max-w-[50%]">
            {aula.modulo === 'Eletiva' && (
            <span className="bg-purple-900/50 text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                ELETIVA
            </span>
            )}
            {aula.grupo && (
             <span className="bg-blue-900/50 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-lg shrink-0 text-right leading-tight">
                {aula.grupo}
             </span>
            )}
        </div>
      </div>
      <div className="space-y-2">
        <AulaInfo icon={<ClockIcon />} label="Horário" text={aula.horario} />
        {aula.tipo && <AulaInfo icon={<ClipboardListIcon />} label="Tipo" text={aula.tipo} />}
        <AulaInfo icon={<LocationIcon />} label="Sala" text={aula.sala} />
        {aula.professor && <AulaInfo icon={<UserIcon />} label="Professor" text={aula.professor} />}
      </div>
      {aula.observacao && (
        <div className="mt-4 pt-3 border-t border-slate-700">
            <div className="flex items-start gap-3 text-sm text-amber-300 bg-amber-900/30 p-3 rounded-lg">
                <InfoIcon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p>{aula.observacao}</p>
            </div>
        </div>
      )}
    </div>
  );
};

// Card informativo para os intervalos livres - com estilo para dia inteiro
const FreeSlotCard: React.FC<{ horario: string, isFullDay?: boolean }> = ({ horario, isFullDay = false }) => (
  <div className={`rounded-lg border text-center p-3 flex flex-col items-center justify-center free-slot-card
    ${isFullDay 
      ? 'bg-emerald-950 border-emerald-800 text-emerald-400 flex-grow min-h-[200px]' 
      : 'bg-emerald-900/60 border-emerald-800 text-emerald-300'
    }`
  }>
    <div className={`flex items-center gap-2 ${isFullDay ? 'mb-2' : 'mb-1'}`}>
      <CoffeeIcon className={isFullDay ? 'w-6 h-6' : 'w-5 h-5'} />
      <BookIcon className={isFullDay ? 'w-6 h-6' : 'w-5 h-5'} />
    </div>
    <p className={`font-semibold ${isFullDay ? 'text-lg' : 'text-sm'}`}>Horário Livre</p>
    <p className={`${isFullDay ? 'text-sm' : 'text-xs'}`}>{horario}</p>
  </div>
);


// Card do dia, que agrupa os cards de aula
const DiaCard: React.FC<{ diaDeAula: DiaDeAula }> = ({ diaDeAula }) => {
  const isFullDayFree = diaDeAula.aulas.length === 1 && diaDeAula.aulas[0].isFreeSlot;

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg flex flex-col h-full overflow-hidden border border-slate-700 dia-card">
      <h3 className="bg-afya-pink text-white font-bold p-3 text-center tracking-wide flex-shrink-0 text-lg">
        {diaDeAula.dia}
      </h3>
      <div className={`p-4 space-y-4 flex-grow flex flex-col ${isFullDayFree ? 'h-full' : ''}`}>
        {diaDeAula.aulas.map((aula, index) =>
          aula.isFreeSlot ? (
            <FreeSlotCard 
              key={`free-${diaDeAula.dia}-${index}`} 
              horario={aula.horario} 
              isFullDay={isFullDayFree} 
            />
          ) : (
            <AulaCard key={`${aula.disciplina}-${aula.horario}-${index}`} aula={aula} />
          )
        )}
      </div>
    </div>
  );
};

interface ScheduleDisplayProps {
  schedule: Schedule | null;
  periodo: string;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, periodo }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getFormattedGroups = (): string => {
    if (!schedule) return "";
    
    const allGroups = new Set<string>();
    schedule.forEach(dia => {
        dia.aulas.forEach(aula => {
            if (!aula.isFreeSlot) {
                if (aula.originalGroups && aula.originalGroups.length > 0) {
                    aula.originalGroups.forEach(g => allGroups.add(g));
                } else if (aula.grupo) {
                    allGroups.add(aula.grupo);
                }
            }
        });
    });

    return formatGroupLabel(Array.from(allGroups));
  };

  const handleViewPdf = async () => {
    const scheduleContent = document.getElementById('schedule-pdf-content');
    const sourceGrid = scheduleContent?.querySelector('.grid');

    if (!scheduleContent || !sourceGrid) {
      console.error('Elemento do cronograma não encontrado para gerar o PDF.');
      return;
    }
  
    setIsGeneratingPdf(true);

    // 1. Cria um wrapper escondido (off-screen) que vai conter todas as páginas
    const pdfHiddenWrapper = document.createElement('div');
    pdfHiddenWrapper.className = 'pdf-hidden-wrapper';
    document.body.appendChild(pdfHiddenWrapper);

    // Helper to create watermark
    const createWatermark = () => {
        const img = document.createElement('img');
        img.src = 'https://cdn.prod.website-files.com/65e07e5b264deb36f6e003d9/6883f05c26e613e478e32cd9_A.png';
        img.className = 'pdf-watermark';
        return img;
    };
    
    // 2. Prepara os elementos comuns (Header)
    const createHeader = () => {
        const header = document.createElement('div');
        header.className = 'pdf-header';
        
        // Logo
        const logo = document.createElement('img');
        logo.src = 'https://cdn.cookielaw.org/logos/309bef31-1bad-4222-a8de-b66feda5e113/e1bda879-fe71-4686-b676-cc9fbc711aee/fcb85851-ec61-4efb-bae5-e72fdeacac0e/AFYA-FACULDADEMEDICAS-logo.png';
        logo.alt = 'Logo Afya Ciências Médicas';
        logo.className = 'pdf-logo';
        header.appendChild(logo);
        
        // Info Coordenação (Direita)
        const infoDiv = document.createElement('div');
        infoDiv.className = 'pdf-header-info';
        
        const title = document.createElement('h1');
        title.textContent = 'COORDENAÇÃO DO CURSO DE MEDICINA';
        infoDiv.appendChild(title);
        
        const subTitle = document.createElement('p');
        subTitle.textContent = 'Coordenador do Curso: Prof. Kristhea Karyne | Coordenadora Adjunta: Prof. Roberya Viana';
        infoDiv.appendChild(subTitle);
        
        header.appendChild(infoDiv);
        
        return header;
    };
    
    const groupsText = getFormattedGroups();
    const createTitle = (pageIndex: number, totalPages: number) => {
        const title = document.createElement('h2');
        title.className = 'pdf-title';
        
        let titleText = `Semana Padrão 2026.1 - ${periodo}`;
        if (groupsText) {
            titleText += ` - ${groupsText}`;
        }
        
        if (totalPages > 1) {
            titleText += ` (Página ${pageIndex + 1}/${totalPages})`;
        }
        
        title.textContent = titleText;
        return title;
    };

    // 3. Calcula paginação Horizontal (Dias) e Vertical (Aulas por dia)
    const dayItems = Array.from(sourceGrid.children);
    const itemsPerCol = 5; 
    const maxCardsPerCol = 4; // Máximo de cards de aula por coluna
    const totalHorizontalPages = Math.ceil(dayItems.length / itemsPerCol);
    
    // Estrutura para armazenar o planejamento das páginas
    interface PagePlan {
        dayChunk: Element[];
        cardStart: number;
        cardEnd: number;
    }
    
    const pdfPagesToRender: PagePlan[] = [];

    for (let h = 0; h < totalHorizontalPages; h++) {
        const chunk = dayItems.slice(h * itemsPerCol, (h + 1) * itemsPerCol);
        
        // Calcula o máximo de cards nesta seção horizontal para saber quantas páginas verticais são necessárias
        let maxCardsInChunk = 0;
        chunk.forEach(dayEl => {
            // Encontra o container de cards (segundo filho do DiaCard, que é a div com p-4)
            const cardContainer = dayEl.querySelector('div.p-4');
            if (cardContainer) {
                maxCardsInChunk = Math.max(maxCardsInChunk, cardContainer.children.length);
            }
        });
        
        // Se houver cards, calcula quantas páginas verticais; se não (ex: dia vazio), garante pelo menos 1 página
        const verticalPages = maxCardsInChunk > 0 ? Math.ceil(maxCardsInChunk / maxCardsPerCol) : 1;

        for (let v = 0; v < verticalPages; v++) {
            pdfPagesToRender.push({
                dayChunk: chunk,
                cardStart: v * maxCardsPerCol,
                cardEnd: (v + 1) * maxCardsPerCol
            });
        }
    }

    // 4. Renderiza as páginas no DOM escondido
    pdfPagesToRender.forEach((plan, index) => {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-export-container';

        pageContainer.appendChild(createWatermark()); // Restore Watermark
        pageContainer.appendChild(createHeader());
        pageContainer.appendChild(createTitle(index, pdfPagesToRender.length));

        const grid = document.createElement('div');
        grid.className = 'pdf-export-grid';
        
        plan.dayChunk.forEach(originalDayItem => {
            // Clona a estrutura do DiaCard
            const dayCardClone = originalDayItem.cloneNode(true) as HTMLElement;
            const cardsContainer = dayCardClone.querySelector('div.p-4'); // Container dos cards
            
            if (cardsContainer) {
                // Limpa os cards existentes no clone
                cardsContainer.innerHTML = '';
                
                // Pega os cards originais do elemento fonte
                const originalContainer = originalDayItem.querySelector('div.p-4');
                if (originalContainer) {
                    const originalCards = Array.from(originalContainer.children);
                    // Fatia apenas os cards correspondentes a esta página vertical
                    const cardsSlice = originalCards.slice(plan.cardStart, plan.cardEnd);
                    
                    cardsSlice.forEach(card => {
                        cardsContainer.appendChild(card.cloneNode(true));
                    });
                }
            }
            grid.appendChild(dayCardClone);
        });
        
        pageContainer.appendChild(grid);
        pdfHiddenWrapper.appendChild(pageContainer);
    });

    // 5. Aguarda renderização e captura
    requestAnimationFrame(async () => {
      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a3',
        });

        const pages = pdfHiddenWrapper.querySelectorAll('.pdf-export-container');

        for (let i = 0; i < pages.length; i++) {
            const pageEl = pages[i] as HTMLElement;
            
            const canvas = await html2canvas(pageEl, {
              scale: 2, // Alta resolução
              useCORS: true,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            if (i > 0) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        }

        const pdfUrl = pdf.output('bloburl');
        window.open(pdfUrl, '_blank');

      } catch (e) {
        console.error('Erro ao gerar o PDF:', e);
        alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
      } finally {
        document.body.removeChild(pdfHiddenWrapper);
        setIsGeneratingPdf(false);
      }
    });
  };
  
  const hasClasses = schedule && schedule.some(dia => dia.aulas.some(aula => !aula.isFreeSlot));

  if (!hasClasses) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-gray-200">Nenhuma aula encontrada</p>
        <p className="text-md mt-1 text-gray-400">
          Não há aulas correspondentes aos filtros selecionados para esta semana.
        </p>
      </div>
    );
  }

  return (
    <div>
       <div className="flex justify-end mb-6">
        <button
          onClick={handleViewPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 border border-slate-600 disabled:opacity-50 disabled:cursor-wait shadow-sm"
        >
          {isGeneratingPdf ? (
            <>
              <SpinnerIcon className="w-4 h-4" /> Gerando PDF...
            </>
          ) : (
            <>
              <ExternalLinkIcon className="w-4 h-4" /> Visualizar PDF
            </>
          )}
        </button>
      </div>
      <div id="schedule-pdf-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedule.map((dia, index) => (
            <div key={dia.dia} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <DiaCard diaDeAula={dia} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDisplay;
