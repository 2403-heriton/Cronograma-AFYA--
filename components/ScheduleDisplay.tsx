import React, { useMemo } from 'react';
import type { Schedule, DiaDeAula, Aula } from '../types';
import { MODULE_COLORS, DEFAULT_MODULE_COLOR } from '../constants';
import ClockIcon from './icons/ClockIcon';
import UserIcon from './icons/UserIcon';
import LocationIcon from './icons/LocationIcon';
import NotFoundIcon from './icons/NotFoundIcon';
import CoffeeIcon from './icons/CoffeeIcon';
import BookIcon from './icons/BookIcon';
import CalendarIcon from './icons/CalendarIcon';

// Local types for rendering logic
type HorarioLivre = {
  tipo: 'livre';
  horario: string;
  turno: string;
};
type ScheduleItem = Aula | HorarioLivre;


const AulaInfo: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <span className="text-gray-400">{icon}</span>
    <span><strong className="font-medium text-gray-300">{label}:</strong> {value}</span>
  </div>
);

const AulaCard: React.FC<{ aula: Aula }> = ({ aula }) => {
  const colorClass = aula.modulo ? MODULE_COLORS[aula.modulo] || DEFAULT_MODULE_COLOR : DEFAULT_MODULE_COLOR;
  
  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return "Data Inválida";
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString; // Retorna o original se não for parseável
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970) {
        return dateString;
    }
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    // Retorna a data no formato DD/MM/YYYY
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
  };
  
  return (
    <div className={`bg-gray-700/50 p-4 rounded-lg border-l-4 ${colorClass} border-t border-r border-b border-gray-600 transition-shadow duration-300 hover:shadow-md hover:bg-gray-700 flex flex-col`}>
      <div>
        <p className="font-bold text-white mb-2">{aula.disciplina}</p>
        <div className="space-y-1">
          <AulaInfo icon={<ClockIcon className="w-4 h-4" />} label="Horário" value={aula.horario} />
          <AulaInfo icon={<UserIcon className="w-4 h-4" />} label="Professor" value={aula.professor} />
          <AulaInfo icon={<LocationIcon className="w-4 h-4" />} label="Sala" value={aula.sala} />
        </div>
      </div>

      {aula.events && aula.events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600/50 space-y-2">
          {aula.events.map((event, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-amber-300 bg-amber-900/20 p-2 rounded-md">
               <CalendarIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
               <div className="flex-grow">
                 <p className="font-semibold">{event.tipo}</p>
                 <p className="text-xs text-amber-200">{formatDate(event.data)} às {event.horario}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FreeSlotCard: React.FC<{ slot: HorarioLivre; fullDay?: boolean }> = ({ slot, fullDay }) => (
    <div className={`bg-green-500/25 p-4 rounded-lg border border-green-500/50 flex items-center justify-center text-center ${fullDay ? 'w-full h-full' : ''}`}>
        <div className="flex flex-col items-center gap-2 text-green-100">
            <div className="flex items-center gap-4">
              <CoffeeIcon className="w-6 h-6" />
              <BookIcon className="w-6 h-6" />
            </div>
            <div >
                <p className="font-semibold text-white">Horário Livre</p>
                <p className="text-sm text-green-200">{slot.horario}</p>
            </div>
        </div>
    </div>
);


const DiaCard: React.FC<{ diaDeAula: DiaDeAula }> = ({ diaDeAula }) => {
  const scheduleItems = useMemo((): ScheduleItem[] => {
    // Helper to convert HH:mm string to total minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
      if (!timeStr || !timeStr.includes(':')) return -1;
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return -1;
      return hours * 60 + minutes;
    };

    // Helper to convert total minutes to HH:mm string
    const minutesToTime = (totalMinutes: number): string => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    if (!diaDeAula.aulas || diaDeAula.aulas.length === 0) {
        return [];
    }
    
    // Day boundaries in minutes
    const DAY_START_MINUTES = 7 * 60; // 07:00
    const DAY_END_MINUTES = 22 * 60;   // 22:00

    const parsedAulas = diaDeAula.aulas
        .map(aula => {
            const [startStr, endStr] = aula.horario.split(' - ');
            return {
                ...aula,
                startMinutes: timeToMinutes(startStr),
                endMinutes: timeToMinutes(endStr),
            };
        })
        .filter(aula => aula.startMinutes !== -1 && aula.endMinutes !== -1)
        .sort((a, b) => a.startMinutes - b.startMinutes);

    const processedItems: ScheduleItem[] = [];
    let cursorMinutes = DAY_START_MINUTES;

    parsedAulas.forEach(aula => {
        // Check for a gap before the current class
        if (aula.startMinutes > cursorMinutes) {
            processedItems.push({
                tipo: 'livre',
                turno: 'Intervalo',
                horario: `${minutesToTime(cursorMinutes)} - ${minutesToTime(aula.startMinutes)}`,
            });
        }
        // Add the class itself
        processedItems.push(aula);
        // Move the cursor to the end of the current class
        cursorMinutes = aula.endMinutes;
    });

    // Check for a final free slot at the end of the day
    if (cursorMinutes < DAY_END_MINUTES) {
        processedItems.push({
            tipo: 'livre',
            turno: 'Intervalo',
            horario: `${minutesToTime(cursorMinutes)} - ${minutesToTime(DAY_END_MINUTES)}`,
        });
    }

    return processedItems;
  }, [diaDeAula.aulas]);


  if (diaDeAula.aulas.length === 0) {
     return (
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden flex flex-col h-full">
            <h3 className="bg-afya-pink text-white text-lg font-semibold p-4 text-center">
                {diaDeAula.dia}
            </h3>
            <div className="p-4 flex-grow flex">
                <FreeSlotCard slot={{ tipo: 'livre', turno: 'Dia Inteiro', horario: '07:00 - 22:00' }} fullDay={true} />
            </div>
        </div>
     );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden flex flex-col h-full">
      <h3 className="bg-afya-pink text-white text-lg font-semibold p-4 text-center">
        {diaDeAula.dia}
      </h3>
      <div className="p-4 flex-grow space-y-3">
        {scheduleItems.map((item, index) => {
            if ('disciplina' in item) { // Type guard for Aula
              return <AulaCard key={`${item.disciplina}-${index}`} aula={item} />;
            }
            // It must be HorarioLivre
            return <FreeSlotCard key={`${item.turno}-${index}`} slot={item} />;
          })
        }
      </div>
    </div>
  );
};


const ScheduleDisplay: React.FC<{ schedule: Schedule | null }> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-white">Nenhum cronograma encontrado.</p>
        <p className="text-md mt-1 text-gray-400">
          Verifique se os dados estão atualizados ou se os filtros selecionados estão corretos.
        </p>
      </div>
    );
  }

  const weekDays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  const completeSchedule = weekDays.map(dayName => {
      const dayData = schedule.find(d => d.dia === dayName);
      return dayData || { dia: dayName, aulas: [] };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {completeSchedule.map((dia, index) => (
        <div key={dia.dia} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
           <DiaCard diaDeAula={dia} />
        </div>
      ))}
    </div>
  );
};

export default ScheduleDisplay;