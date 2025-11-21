
import React, { useState, useMemo } from 'react';
import type { Event } from '../types';
import { stringToColor } from '../services/colorService';
import { parseBrDate } from '../services/scheduleService';
import NotFoundIcon from './icons/NotFoundIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';

// FIX: Removed redeclared global types for jspdf and html2canvas. These are now defined in types.ts.

const EventInfo: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm text-gray-400">
    <span className="text-afya-pink flex-shrink-0 w-3 h-3 mt-0.5">{icon}</span>
    <span><strong className="font-medium text-gray-200">{label}:</strong> {value}</span>
  </div>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const color = stringToColor(event.disciplina);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970) {
        return dateString;
    }
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
  };

  const formattedStartDate = formatDate(event.data);
  const formattedEndDate = formatDate(event.data_fim);

  let dateDisplay = formattedStartDate;
  if (formattedEndDate && formattedEndDate !== formattedStartDate) {
      dateDisplay = `de ${formattedStartDate} à ${formattedEndDate}`;
  }

  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg border-l-4 border border-slate-700 shadow-md flex flex-col h-full event-card-pdf"
      style={{ borderLeftColor: color }}
    >
      <p className="font-bold text-gray-100 mb-2">{event.disciplina}</p>
      <div className="space-y-1">
        {dateDisplay && <EventInfo icon={<CalendarIcon />} label="Período" value={dateDisplay} />}
        <EventInfo icon={<ClipboardListIcon />} label="Tipo" value={event.tipo} />
        <EventInfo icon={<ClockIcon />} label="Horário" value={event.horario} />
        <EventInfo icon={<LocationIcon />} label="Local" value={event.local} />
      </div>
    </div>
  );
};

interface EventDisplayProps {
  events: Event[] | null;
  periodo: string;
}

const EventDisplay: React.FC<EventDisplayProps> = ({ events, periodo }) => {
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const eventTypes = useMemo(() => {
    if (!events) return [];
    const types = new Set(events.map(event => event.tipo));
    return ['Todos', ...Array.from(types).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return null;
    if (selectedType === 'Todos') {
      return events;
    }
    return events.filter(event => event.tipo === selectedType);
  }, [events, selectedType]);
  
  const groupedByMonth = useMemo(() => {
    if (!filteredEvents) return {};

    return filteredEvents.reduce<Record<string, Event[]>>((acc, event) => {
        const date = parseBrDate(event.data);
        if (isNaN(date.getTime()) || date.getFullYear() < 1971) return acc;
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(event);
        return acc;
    }, {});
  }, [filteredEvents]);
  
  const sortedMonthKeys = useMemo(() => Object.keys(groupedByMonth).sort(), [groupedByMonth]);

  const handleViewPdf = async () => {
    const eventsContent = document.getElementById('events-pdf-content');
    if (!eventsContent) {
      console.error('Elemento de eventos não encontrado para gerar o PDF.');
      return;
    }
  
    setIsGeneratingPdf(true);
  
    // 1. Create wrapper
    const pdfHiddenWrapper = document.createElement('div');
    pdfHiddenWrapper.className = 'pdf-hidden-wrapper';
    document.body.appendChild(pdfHiddenWrapper);

    // Helper for watermark
    const createWatermark = () => {
        const img = document.createElement('img');
        img.src = 'https://cdn.prod.website-files.com/65e07e5b264deb36f6e003d9/6883f05c26e613e478e32cd9_A.png';
        img.className = 'pdf-watermark';
        return img;
    };
    
    // Helper for Header (Standardized)
    const createHeader = () => {
        const header = document.createElement('div');
        header.className = 'pdf-header';
        
        const logo = document.createElement('img');
        logo.src = 'https://cdn.cookielaw.org/logos/309bef31-1bad-4222-a8de-b66feda5e113/e1bda879-fe71-4686-b676-cc9fbc711aee/fcb85851-ec61-4efb-bae5-e72fdeacac0e/AFYA-FACULDADEMEDICAS-logo.png';
        logo.alt = 'Logo Afya Ciências Médicas';
        logo.className = 'pdf-logo';
        header.appendChild(logo);
        
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

    // 2. Process chunks
    // We will iterate through the DOM elements to respect the current filtering and sorting
    const contentClone = eventsContent.cloneNode(true) as HTMLElement;
    const monthGroups = contentClone.querySelectorAll('.event-month-group-pdf');
    
    const CARDS_PER_PAGE = 12; // 3 columns * 4 rows

    monthGroups.forEach((group) => {
        const monthTitleEl = group.querySelector('h3');
        const monthTitle = monthTitleEl ? monthTitleEl.textContent : '';
        
        // The grid in the DOM might have different classes, let's find the container with grid
        const grid = group.querySelector('.grid');
        if (!grid) return;

        const cards = Array.from(grid.children);
        const totalCards = cards.length;
        const totalPagesForMonth = Math.ceil(totalCards / CARDS_PER_PAGE);

        for (let i = 0; i < totalPagesForMonth; i++) {
            const start = i * CARDS_PER_PAGE;
            const end = start + CARDS_PER_PAGE;
            const chunk = cards.slice(start, end);

            // Create Page Container
            const pageContainer = document.createElement('div');
            pageContainer.className = 'pdf-export-container';
            
            pageContainer.appendChild(createWatermark());
            pageContainer.appendChild(createHeader());

            // Page Title
            const pageTitle = document.createElement('h2');
            pageTitle.className = 'pdf-title';
            let titleText = `Calendário de Eventos - ${periodo}`;
            if (totalPagesForMonth > 1) {
                 titleText += ` (${i + 1}/${totalPagesForMonth})`;
            }
            pageTitle.textContent = titleText;
            pageContainer.appendChild(pageTitle);

            // Content Wrapper
            const monthWrapper = document.createElement('div');
            monthWrapper.className = 'event-month-group-pdf';
            
            // Month Header (Always show which month these events belong to)
            const monthHeader = document.createElement('h3');
            // Copy styles from the original h3 (defined in index.html css for .pdf-export-container .event-month-group-pdf h3)
            monthHeader.textContent = monthTitle + (i > 0 ? ' (Continuação)' : '');
            monthWrapper.appendChild(monthHeader);

            // Grid
            const gridClone = document.createElement('div');
            gridClone.className = 'pdf-export-event-grid'; // Uses the 3-column grid defined in CSS
            
            chunk.forEach(card => {
                gridClone.appendChild(card.cloneNode(true));
            });

            monthWrapper.appendChild(gridClone);
            pageContainer.appendChild(monthWrapper);
            
            pdfHiddenWrapper.appendChild(pageContainer);
        }
    });

    // 3. Render
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
              scale: 2,
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

  if (!events || events.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-gray-200">Nenhum evento encontrado.</p>
        <p className="text-md mt-1 text-gray-400">
           Não há eventos correspondentes aos filtros selecionados.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="w-full sm:w-auto sm:flex-1 max-w-sm mx-auto sm:mx-0">
          {eventTypes.length > 2 && (
            <>
              <label htmlFor="event-type-filter" className="block mb-2 text-sm font-medium text-gray-400 text-center sm:text-left">
                  Filtrar por tipo de evento
              </label>
              <select
                  id="event-type-filter"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-3 bg-slate-700 text-gray-200 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-afya-pink focus:border-afya-pink transition duration-150 ease-in-out appearance-none"
              >
                  {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                  ))}
              </select>
            </>
          )}
        </div>

        <div className="w-full sm:w-auto flex-shrink-0 pt-0 sm:pt-6">
           <button
            onClick={handleViewPdf}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-3 sm:py-2 px-4 rounded-lg transition-colors duration-200 border border-slate-600 disabled:opacity-50 disabled:cursor-wait shadow-sm"
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
      </div>
      
      <div id="events-pdf-content">
        {(!filteredEvents || filteredEvents.length === 0) ? (
          <div className="text-center text-gray-400 p-8 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-lg text-gray-200 font-semibold">Nenhum evento do tipo "{selectedType}" foi encontrado.</p>
              <p className="text-sm mt-1">Tente selecionar outra categoria no filtro acima.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedMonthKeys.map((monthKey, index) => {
              const eventsInMonth = groupedByMonth[monthKey];
              const [year, month] = monthKey.split('-').map(Number);
              const monthDate = new Date(year, month - 1, 1);
              
              const monthName = new Intl.DateTimeFormat('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo'
              }).format(monthDate);

              return (
                <div key={monthKey} className="animate-fade-in event-month-group-pdf" style={{ animationDelay: `${index * 150}ms` }}>
                    <h3 className="text-2xl font-bold text-afya-pink mb-4 capitalize pl-2 border-l-4 border-afya-pink">
                      {monthName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {eventsInMonth.map((event, eventIndex) => (
                            <div key={`${event.disciplina}-${event.data}-${eventIndex}`} className="transition-transform duration-300 hover:scale-[1.02]">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDisplay;
