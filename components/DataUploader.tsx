import React, { useState, useRef } from 'react';
import { updateDataFromExcel } from '../services/scheduleService';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import type { AulaEntry, Event, EletivaEntry } from '../types';

interface UploadData {
  aulasData: AulaEntry[];
  eventsData: Event[];
  eletivasData: EletivaEntry[];
  eventsSheetName?: string;
}

interface DataUploaderProps {
  onUploadSuccess: (data: UploadData) => void;
}

// Senha para proteger o upload. Em uma aplicação real, isso deveria ser mais seguro.
const ADMIN_PASSWORD = "afyaadmin2024";

const DataUploader: React.FC<DataUploaderProps> = ({ onUploadSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [generatedFiles, setGeneratedFiles] = useState<{ aulas: string; eventos: string; eletivas: string; } | null>(null);
    const [eventsSourceSheet, setEventsSourceSheet] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStatus('idle');
        setMessage('');
        setGeneratedFiles(null);
        setEventsSourceSheet(null);
    };

    const downloadJson = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        resetState();

        const password = window.prompt("Acesso Restrito: Digite a senha para processar a planilha.");
        
        if (password !== ADMIN_PASSWORD) {
            if (password !== null) { // Usuário digitou algo e clicou OK
                setStatus('error');
                setMessage('Senha incorreta. Upload cancelado.');
                setTimeout(resetState, 3000);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setStatus('loading');
        setMessage('Processando planilha...');

        try {
            const parsedData = await updateDataFromExcel(file);
            onUploadSuccess(parsedData); // Chama o callback com os novos dados
            
            setGeneratedFiles({
                aulas: JSON.stringify(parsedData.aulasData, null, 2),
                eventos: JSON.stringify(parsedData.eventsData, null, 2),
                eletivas: JSON.stringify(parsedData.eletivasData, null, 2),
            });
            setEventsSourceSheet(parsedData.eventsSheetName || null);

            setStatus('success');
            setMessage('Planilha carregada! A pré-visualização foi atualizada em sua tela.');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Falha ao processar o arquivo. Verifique o formato e tente novamente.');
             setTimeout(resetState, 5000);
        } finally {
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const getStatusColor = () => {
        switch(status) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'loading': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                aria-hidden="true"
            />
            <button
                onClick={handleButtonClick}
                disabled={status === 'loading'}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 border border-slate-600 disabled:opacity-50 disabled:cursor-wait"
            >
                <UploadIcon className="w-4 h-4" />
                Atualizar Dados via Planilha
            </button>
            {message && <p className={`text-sm text-center ${getStatusColor()}`} role="status">{message}</p>}

            {status === 'success' && generatedFiles && (
                <div className="w-full mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-center space-y-4">
                     <div>
                        <h4 className="font-semibold text-gray-200 mb-1">Arquivos Gerados</h4>
                        <p className="text-xs text-gray-400">Para disponibilizar estes dados para todos, baixe os arquivos e substitua os existentes na pasta <code>/public</code> do projeto.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button 
                            onClick={() => downloadJson(generatedFiles.aulas, 'aulas.json')}
                            className="flex items-center justify-center gap-2 bg-afya-blue hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Baixar aulas.json
                        </button>
                        <button 
                            onClick={() => downloadJson(generatedFiles.eletivas, 'eletivas.json')}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Baixar eletivas.json
                        </button>
                        <div>
                             <button 
                                onClick={() => downloadJson(generatedFiles.eventos, 'eventos.json')}
                                className="w-full flex items-center justify-center gap-2 bg-afya-pink hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Baixar eventos.json
                            </button>
                            {eventsSourceSheet && (
                                <p className="text-xs text-gray-400 mt-1">
                                    (Dados da aba '{eventsSourceSheet}')
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataUploader;