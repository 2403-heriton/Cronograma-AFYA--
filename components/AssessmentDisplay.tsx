import React, { useMemo } from 'react';
import type { Event } from '../types';
import { stringToColor } from '../services/colorService';
import NotFoundIcon from './icons/NotFoundIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';

const EventInfo: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm text-gray-400">
    <span className="text-afya-pink flex-shrink-0 w-3 h-3 mt-0.5">{icon}</span>
    <span><strong className="font-medium text-gray-200">{label}:</strong> {value}</span>
  </div>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const color = stringToColor(event.disciplina);
  return (
    <div
      className="bg-slate-800 p-4 rounded-lg border-l-4 border-t border-r border-b border-slate-700 transition-shadow duration-300 hover:shadow-md hover:bg-slate-700/50"
      style={{ borderLeftColor: color }}
    >
      <p className="font-bold text-gray-100 mb-2">{event.disciplina}</p>
      <div className="space-y-1">
        <EventInfo icon={<ClipboardListIcon />} label="Tipo" value={event.tipo} />
        <EventInfo icon={<ClockIcon />} label="Horário" value={event.horario} />
        <EventInfo icon={<LocationIcon />} label="Local" value={event.local} />
      </div>
    </div>
  );
};

const AssessmentDisplay: React.FC<{ events: Event[] | null }> = ({ events }) => {
  const groupedEvents = useMemo(() => {
    // FIX: Explicitly type the accumulator in the reduce function to ensure correct type inference.
    // FIX: Added type assertion to the initial value of reduce to ensure useMemo infers the correct return type.
    return (events || []).reduce((acc: Record<string, Event[]>, event) => {
      const date = event.data;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, Event[]>);
  }, [events]);

  if (!events) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-gray-200">Nenhuma avaliação encontrada.</p>
        <p className="text-md mt-1 text-gray-400">
           Use o botão "Atualizar Dados via Planilha" para carregar as avaliações.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return "Data Inválida";
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
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([date, eventsOnDate], index) => (
        <div key={date} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
            <h3 className="bg-afya-pink text-white text-lg font-semibold p-4 flex items-center gap-3">
              <CalendarIcon className="w-6 h-6" />
              {formatDate(date)}
            </h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* FIX: Check if eventsOnDate is an array before mapping to resolve TS error. */}
              {Array.isArray(eventsOnDate) && eventsOnDate.map((event, idx) => (
                <EventCard key={`${event.disciplina}-${idx}`} event={event} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssessmentDisplay;