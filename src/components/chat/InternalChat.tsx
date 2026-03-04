import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Hash, Users, User, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  channel: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface InternalChatProps {
  currentUserName: string;
  currentUserRole: 'admin' | 'employee' | 'client';
}

const CHANNELS = [
  { id: 'geral', label: '# Geral', icon: Hash, description: 'Todos os membros' },
  { id: 'admin', label: '# Admin', icon: Users, description: 'Somente admin' },
  { id: 'avisos', label: '# Avisos', icon: MessageCircle, description: 'Comunicados importantes' },
];

const db = supabase as any;

export default function InternalChat({ currentUserName, currentUserRole }: InternalChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from('chat_messages')
      .select('*')
      .eq('channel', activeChannel)
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  }, [activeChannel, scrollToBottom]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel=eq.${activeChannel}`,
        },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 100);
          // Show notification if message is from someone else
          if (newMsg.sender_name !== currentUserName) {
            toast({
              title: `💬 ${newMsg.sender_name}`,
              description: newMsg.content.slice(0, 80),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, currentUserName, toast, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const { error } = await db.from('chat_messages').insert({
      channel: activeChannel,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      content: newMessage.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: '❌ Erro ao enviar', description: error.message, variant: 'destructive' });
    } else {
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-100 text-amber-800';
      case 'employee': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'employee': return 'Funcionário';
      case 'client': return 'Cliente';
      default: return role;
    }
  };

  const visibleChannels = CHANNELS.filter(ch => {
    if (ch.id === 'admin' && currentUserRole !== 'admin') return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col sm:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Channels Sidebar - hidden on mobile, show as horizontal tabs */}
      <div className="hidden sm:flex w-56 bg-white border-r border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-amber-500" />
            Chat Interno
          </h2>
          <p className="text-xs text-gray-500 mt-1">Comunicação da equipe</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {visibleChannels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeChannel === ch.id
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ch.icon className="w-4 h-4" />
              <div className="text-left">
                <div className="font-bold">{ch.label}</div>
                <div className="text-[10px] opacity-70">{ch.description}</div>
              </div>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{currentUserName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${getRoleColor(currentUserRole)}`}>
                {getRoleLabel(currentUserRole)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile channel tabs */}
      <div className="sm:hidden flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 overflow-x-auto">
        {visibleChannels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeChannel === ch.id
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <ch.icon className="w-3.5 h-3.5" />
            {ch.label}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
          <Hash className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900 text-lg">{activeChannel}</h3>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{visibleChannels.find(c => c.id === activeChannel)?.description}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-bold">Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_name === currentUserName;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isMe ? 'order-1' : ''}`}>
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold">
                          {msg.sender_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{msg.sender_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${getRoleColor(msg.sender_role)}`}>
                          {getRoleLabel(msg.sender_role)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-amber-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mensagem em #${activeChannel}...`}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
