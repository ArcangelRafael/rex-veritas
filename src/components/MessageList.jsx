import { useState, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { Loader2, ChevronDown, ChevronUp, Trash2, Mail, CheckCircle2, Archive, ArchiveRestore, AlertTriangle, Info } from 'lucide-react';

export const MessageList = ({ onUnreadCountChange }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('INBOX'); // NUEVO: Estado de pestañas

  // NUEVO: Estado para el modal global de alertas y confirmaciones
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '', onConfirm: null });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg, onConfirm: null });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg, onConfirm: null });
  const showConfirm = (msg, onConfirmCallback) => setModalConfig({ isOpen: true, type: 'confirm', message: msg, onConfirm: onConfirmCallback });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getMessages();
      setMessages(data);
      updateUnreadBadge(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUnreadBadge = (msgs) => {
    // Solo contamos como "nuevos" los que no están leídos Y no están archivados
    const unreadCount = msgs.filter(m => !m.isRead && !m.isArchived).length;
    if (onUnreadCountChange) onUnreadCountChange(unreadCount);
  };

  const toggleExpand = async (message) => {
    const isExpanding = !expandedIds.includes(message.id);
    
    setExpandedIds(prev => 
      isExpanding ? [...prev, message.id] : prev.filter(id => id !== message.id)
    );

    if (isExpanding && !message.isRead) {
      try {
        await messageService.markAsRead(message.id);
        const updatedMsgs = messages.map(m => m.id === message.id ? { ...m, isRead: true } : m);
        setMessages(updatedMsgs);
        updateUnreadBadge(updatedMsgs);
      } catch (error) {
        console.error("Error marcando como leído:", error);
      }
    }
  };

  // REEMPLAZO DEL WINDOW.CONFIRM POR EL MODAL
  const handleDelete = (e, id) => {
    e.stopPropagation(); 
    showConfirm("¿Seguro que deseas eliminar este mensaje de forma permanente?", async () => {
      closeModal();
      try {
        await messageService.deleteMessage(id);
        const updatedMsgs = messages.filter(m => m.id !== id);
        setMessages(updatedMsgs);
        updateUnreadBadge(updatedMsgs);
        showSuccess("Mensaje eliminado correctamente.");
      } catch (error) {
        showError("Error al eliminar el mensaje.");
      }
    });
  };

  // NUEVO: Funciones para archivar/desarchivar
  const handleArchiveToggle = async (e, message) => {
    e.stopPropagation();
    try {
      if (message.isArchived) {
        await messageService.unarchiveMessage(message.id);
        const updatedMsgs = messages.map(m => m.id === message.id ? { ...m, isArchived: false } : m);
        setMessages(updatedMsgs);
        updateUnreadBadge(updatedMsgs);
        showSuccess("Mensaje regresado a la Bandeja Principal.");
      } else {
        await messageService.archiveMessage(message.id);
        const updatedMsgs = messages.map(m => m.id === message.id ? { ...m, isArchived: true, isRead: true } : m);
        setMessages(updatedMsgs);
        updateUnreadBadge(updatedMsgs);
        showSuccess("Mensaje archivado correctamente.");
      }
    } catch (error) {
      showError("Error al cambiar el estado del mensaje.");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-white" /></div>;

  // Filtramos los mensajes según la pestaña seleccionada
  const inboxMessages = messages.filter(m => !m.isArchived);
  const archivedMessages = messages.filter(m => m.isArchived);
  const displayMessages = activeTab === 'INBOX' ? inboxMessages : archivedMessages;

  return (
    <div className="space-y-4 relative">
      
      {/* MODAL GLOBAL DE ALERTAS Y CONFIRMACIÓN */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              {modalConfig.type === 'error' && <AlertTriangle className="h-14 w-14 text-red-500 mb-4" />}
              {modalConfig.type === 'success' && <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />}
              {modalConfig.type === 'confirm' && <Info className="h-14 w-14 text-blue-500 mb-4" />}
              <p className="text-gray-800 dark:text-white font-medium text-lg mb-6">{modalConfig.message}</p>
              <div className="flex w-full space-x-3">
                {modalConfig.type === 'confirm' ? (
                  <>
                    <button onClick={closeModal} className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button onClick={modalConfig.onConfirm} className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">Eliminar</button>
                  </>
                ) : (
                  <button onClick={closeModal} className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">Entendido</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SISTEMA DE PESTAÑAS */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-slate-800 mb-4 transition-colors">
        <button
          onClick={() => setActiveTab('INBOX')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'INBOX' ? 'border-slate-900 dark:border-blue-500 text-slate-900 dark:text-blue-500' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Bandeja Principal ({inboxMessages.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'ARCHIVED' ? 'border-slate-900 dark:border-blue-500 text-slate-900 dark:text-blue-500' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Archive className="h-4 w-4" />
          <span>Archivados ({archivedMessages.length})</span>
        </button>
      </div>

      {/* LISTA DE MENSAJES */}
      {displayMessages.length === 0 ? (
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors">
          {activeTab === 'INBOX' ? <Mail className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-700 mb-3" /> : <Archive className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-700 mb-3" />}
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {activeTab === 'INBOX' ? 'Bandeja de entrada vacía.' : 'No tienes mensajes archivados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayMessages.map(msg => {
            const isExpanded = expandedIds.includes(msg.id);
            
            return (
              <div key={msg.id} className={`border rounded-xl overflow-hidden transition-colors ${!msg.isRead ? 'border-orange-300 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                
                <div 
                  onClick={() => toggleExpand(msg)}
                  className="px-5 py-4 cursor-pointer flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
                    {!msg.isRead && (
                      <span className="flex-shrink-0 animate-pulse bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-max">Nuevo</span>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white truncate">Tema: {msg.subject}</p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tel: {msg.phone}</p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        {msg.createdAt.toLocaleDateString('es-MX')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {msg.createdAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 py-4 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensaje del cliente:</h4>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                      {msg.text}
                    </p>
                    
                    <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
                      <button 
                        onClick={(e) => handleArchiveToggle(e, msg)}
                        className="flex items-center justify-center space-x-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded-lg transition-colors border border-transparent dark:hover:border-blue-800"
                      >
                        {msg.isArchived ? (
                          <><ArchiveRestore className="h-4 w-4" /> <span>Desarchivar</span></>
                        ) : (
                          <><Archive className="h-4 w-4" /> <span>Archivar</span></>
                        )}
                      </button>

                      <button 
                        onClick={(e) => handleDelete(e, msg.id)}
                        className="flex items-center justify-center space-x-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors border border-transparent dark:hover:border-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar Definitivamente</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};