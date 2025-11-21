
import React from 'react';

interface ScheduleFormProps {
  periodo: string;
  setPeriodo: (value: string) => void;
  modulo: string;
  setModulo: (value: string) => void;
  grupo: string;
  setGrupo: (value: string) => void;
  eletiva: string;
  setEletiva: (value: string) => void;
  
  availablePeriods: string[];
  availableModulos: string[];
  availableGrupos: string[];
  availableEletivas: string[];
  
  onSearch: () => void;
  isLoading: boolean;
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  id: string;
  disabled?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, options, id, disabled = false, placeholder = "Todas" }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-2 text-sm font-medium text-gray-400">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-3 bg-slate-700 text-gray-200 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-afya-blue focus:border-afya-blue focus:bg-slate-600 transition duration-150 ease-in-out appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  periodo,
  setPeriodo,
  modulo,
  setModulo,
  grupo,
  setGrupo,
  eletiva,
  setEletiva,
  availablePeriods,
  availableModulos,
  availableGrupos,
  availableEletivas,
  onSearch,
  isLoading,
}) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Período */}
            <div>
                <SelectInput
                    id="periodo"
                    label="Período (Obrigatório)"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    options={availablePeriods}
                    disabled={availablePeriods.length === 0}
                    placeholder="Selecione..."
                />
            </div>

            {/* Módulo */}
            <div>
                <SelectInput
                    id="modulo"
                    label="Módulo (Opcional)"
                    value={modulo}
                    onChange={(e) => setModulo(e.target.value)}
                    options={availableModulos}
                    disabled={!periodo || availableModulos.length === 0}
                    placeholder="Todos os módulos"
                />
            </div>

             {/* Grupo */}
             <div>
                <SelectInput
                    id="grupo"
                    label="Grupo (Opcional)"
                    value={grupo}
                    onChange={(e) => setGrupo(e.target.value)}
                    options={availableGrupos}
                    disabled={!periodo || availableGrupos.length === 0}
                    placeholder="Todos os grupos"
                />
            </div>
            
            {/* Eletiva */}
            <div>
                <SelectInput
                    id="eletiva"
                    label="Eletiva (Opcional)"
                    value={eletiva}
                    onChange={(e) => setEletiva(e.target.value)}
                    options={availableEletivas}
                    disabled={availableEletivas.length === 0}
                    placeholder="Nenhuma"
                />
            </div>
        </div>
        
        <div className="mt-4">
            <button
              type="submit"
              disabled={isLoading || !periodo}
              className="w-full flex justify-center items-center bg-afya-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-afya-blue transition-all duration-200 ease-in-out disabled:bg-slate-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Buscando...' : 'Buscar Cronograma'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleForm;
