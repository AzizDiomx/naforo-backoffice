'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import {
  MessageSquare,
  Send,
  User,
  Lock,
  Search,
  Loader2,
  Building,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Phone,
  ExternalLink,
  FileText,
  AlertTriangle,
  CheckCheck,
  Clock,
  Copy,
  Check,
  Plus,
  MessageCircle,
  Sparkles,
  Filter,
  UserPlus,
  Building2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Filtres
  const [unreadOnlyFilter, setUnreadOnlyFilter] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState('ALL');

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [deleteTargetMessageId, setDeleteTargetMessageId] = useState<string | null>(null);
  const [tenantProfiles, setTenantProfiles] = useState<any[]>([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Quick responses templates
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedThreadRef = useRef<any>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  // ---------------------------------------------------------------------------
  // Initialisation WebSocket & Synchronisation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('chat:message', (data: any) => {
      if (selectedThreadRef.current && data.threadId === selectedThreadRef.current.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
      loadThreads();
    });

    socket.on('chat:message_updated', (data: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, content: data.content, updatedAt: new Date().toISOString() } : m))
      );
      loadThreads();
    });

    socket.on('chat:message_deleted', (data: any) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      loadThreads();
    });

    loadThreads();

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadThreads = () => {
    api.get('/chat/threads')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setThreads(list);
        if (!selectedThreadRef.current && list.length > 0) {
          selectThread(list[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erreur chargement conversations:', err);
        setLoading(false);
      });
  };

  const selectThread = (thread: any) => {
    setSelectedThread(thread);
    selectedThreadRef.current = thread;
    setEditingMessageId(null);
    setInput('');

    if (socketRef.current) {
      socketRef.current.emit('chat:join_thread', thread.id);
    }

    api.get(`/chat/threads/${thread.id}/messages`)
      .then((msgs) => {
        const list = Array.isArray(msgs) ? msgs : msgs?.items || msgs?.data || [];
        setMessages(list);
        setTimeout(() => scrollToBottom('auto'), 80);
      })
      .catch(console.error);
  };

  // ---------------------------------------------------------------------------
  // Envoi / Modification d'un message
  // ---------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedThread || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    try {
      if (editingMessageId) {
        await api.put(`/chat/messages/${editingMessageId}`, { content: text });
        setEditingMessageId(null);
      } else {
        const msg = await api.post(`/chat/threads/${selectedThread.id}/messages`, {
          content: text,
        });

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
      loadThreads();
    } catch (err) {
      console.error('Erreur envoi message:', err);
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Suppression d'un message
  // ---------------------------------------------------------------------------
  const handleConfirmDeleteMessage = async () => {
    if (!deleteTargetMessageId) return;
    try {
      await api.delete(`/chat/messages/${deleteTargetMessageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTargetMessageId));
      setDeleteTargetMessageId(null);
      loadThreads();
    } catch (err) {
      console.error('Erreur suppression message:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Ouverture d'une nouvelle conversation locataire
  // ---------------------------------------------------------------------------
  const openNewChatModal = () => {
    setShowNewChatModal(true);
    setLoadingTenants(true);
    api.get('/tenant-profiles')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setTenantProfiles(list);
      })
      .catch(console.error)
      .finally(() => setLoadingTenants(false));
  };

  const handleStartConversationWithTenant = async (tenant: any) => {
    try {
      const thread = await api.post('/chat/threads', {
        tenantProfileId: tenant.id,
      });
      setShowNewChatModal(false);
      selectThread(thread);
      loadThreads();
    } catch (err) {
      console.error('Erreur initialisation conversation:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Réponses rapides modèles (Quick Canned Replies)
  // ---------------------------------------------------------------------------
  const cannedTemplates = [
    {
      title: "Rappel d'échéance de loyer",
      text: "Bonjour, nous vous rappelons que votre loyer arrive à échéance le 5 de ce mois. Merci de procéder au règlement depuis votre espace locataire.",
    },
    {
      title: "Confirmation de paiement",
      text: "Bonjour, nous accusons bonne réception de votre paiement. Votre quittance de loyer officielle est disponible dans votre espace.",
    },
    {
      title: "Intervention technique",
      text: "Bonjour, suite à votre signalement d'incident, un technicien passera inspecter votre logement sous 48h. Merci de nous confirmer vos disponibilités.",
    },
    {
      title: "Demande de justificatif",
      text: "Bonjour, merci de bien vouloir nous transmettre une copie de votre justificatif à jour afin de compléter votre dossier locatif.",
    },
  ];

  const handleApplyTemplate = (templateText: string) => {
    setInput(templateText);
    setShowQuickTemplates(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const copyMessageText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // Filtrage des conversations
  // ---------------------------------------------------------------------------
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const name = `${t.tenantProfile?.firstName || ''} ${t.tenantProfile?.lastName || ''}`.toLowerCase();
      const property = (t.property?.name || '').toLowerCase();
      const lastMsgText = (t.messages?.[0]?.content || '').toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || property.includes(q) || lastMsgText.includes(q);
      const matchesProperty = propertyFilter === 'ALL' || t.propertyId === propertyFilter;

      return matchesSearch && matchesProperty;
    });
  }, [threads, search, propertyFilter]);

  // Propriétés uniques pour le filtre
  const uniqueProperties = useMemo(() => {
    const map = new Map();
    threads.forEach((t) => {
      if (t.property) {
        map.set(t.property.id, t.property.name);
      }
    });
    return Array.from(map.entries());
  }, [threads]);

  // Regroupement des messages par date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: any[] }[] = [];

    messages.forEach((msg) => {
      const d = new Date(msg.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      if (d.toDateString() === today.toDateString()) {
        label = "Aujourd'hui";
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Hier';
      }

      const existingGroup = groups.find((g) => g.dateLabel === label);
      if (existingGroup) {
        existingGroup.items.push(msg);
      } else {
        groups.push({ dateLabel: label, items: [msg] });
      }
    });

    return groups;
  }, [messages]);

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '16px' }}>

        {/* ----------------------------------------------------------------- */}
        {/* TOP STATUS BAR */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(1, 62, 55, 0.08)',
                color: '#013E37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={18} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Messagerie Locataires
              </h1>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
              Canal de communication direct chiffré AES-256 avec vos locataires en temps réel.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Encryption & Security badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#059669'
            }}>
              <ShieldCheck size={14} />
              <span>Chiffrement AES-256 Actif</span>
            </div>

            {/* New conversation button */}
            <button
              onClick={openNewChatModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#013E37',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 16px',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)'
              }}
            >
              <UserPlus size={16} />
              Nouvelle Conversation
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* MAIN SPLIT VIEW CONTAINER */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          display: 'flex',
          flex: 1,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>

          {/* =============================================================== */}
          {/* LEFT PANEL: THREADS LIST */}
          {/* =============================================================== */}
          <div style={{
            width: '340px',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FAFAFA'
          }}>
            {/* Search & Filter Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Rechercher locataire, bien..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    fontSize: '0.8125rem',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A'
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Property filter dropdown if multiple properties */}
              {uniqueProperties.length > 0 && (
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#475569',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Tous les biens immobiliers</option>
                  {uniqueProperties.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Threads List Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  Chargement des échanges...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <MessageCircle size={28} style={{ color: '#CBD5E1', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>Aucune conversation</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                    Cliquez sur "Nouvelle conversation" pour initier un échange avec un locataire.
                  </div>
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = selectedThread?.id === t.id;
                  const lastMsg = t.messages?.[0];
                  const initials = `${t.tenantProfile?.firstName?.[0] || ''}${t.tenantProfile?.lastName?.[0] || ''}`.toUpperCase();

                  let formattedTime = '';
                  if (lastMsg) {
                    const msgDate = new Date(lastMsg.createdAt);
                    const now = new Date();
                    if (msgDate.toDateString() === now.toDateString()) {
                      formattedTime = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else {
                      formattedTime = msgDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    }
                  }

                  return (
                    <div
                      key={t.id}
                      onClick={() => selectThread(t)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                        border: isSelected ? '1px solid #CBD5E1' : '1px solid transparent',
                        boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {/* Avatar with initials */}
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#013E37' : '#E2E8F0',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.8125rem',
                          flexShrink: 0
                        }}>
                          {initials || <User size={16} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontWeight: '700',
                              fontSize: '0.875rem',
                              color: isSelected ? '#013E37' : '#0F172A',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {t.tenantProfile?.firstName} {t.tenantProfile?.lastName}
                            </span>
                            {formattedTime && (
                              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: '500', flexShrink: 0, marginLeft: '6px' }}>
                                {formattedTime}
                              </span>
                            )}
                          </div>

                          {/* Property label */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            <Building2 size={12} style={{ color: '#94A3B8' }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.property?.name || 'Logement non assigné'}
                            </span>
                          </div>

                          {/* Last message snippet */}
                          {lastMsg && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#64748B',
                              margin: '4px 0 0 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {lastMsg.senderRole === 'tenant' ? '' : 'Vous : '}
                              {lastMsg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* RIGHT PANEL: CONVERSATION ACTIVE WINDOW */}
          {/* =============================================================== */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            position: 'relative'
          }}>
            {selectedThread ? (
              <>
                {/* ----------------------------------------------------------- */}
                {/* CHAT HEADER */}
                {/* ----------------------------------------------------------- */}
                <div style={{
                  padding: '14px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(1, 62, 55, 0.08)',
                      color: '#013E37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.9375rem'
                    }}>
                      {`${selectedThread.tenantProfile?.firstName?.[0] || ''}${selectedThread.tenantProfile?.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                          {selectedThread.tenantProfile?.firstName} {selectedThread.tenantProfile?.lastName}
                        </h3>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          color: '#059669',
                          backgroundColor: '#ECFDF5',
                          padding: '2px 6px',
                          borderRadius: '9999px'
                        }}>
                          Locataire Actif
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        <span>{selectedThread.property?.name}</span>
                        {selectedThread.tenantProfile?.phone && (
                          <>
                            <span>&bull;</span>
                            <a
                              href={`tel:${selectedThread.tenantProfile.phone}`}
                              style={{ color: '#013E37', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Phone size={12} />
                              {selectedThread.tenantProfile.phone}
                            </a>
                            <a
                              href={`https://wa.me/${selectedThread.tenantProfile.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#059669', textDecoration: 'none', fontWeight: '600' }}
                            >
                              (WhatsApp)
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Navigation Shortcuts */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={`/tenants`}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <User size={13} />
                      Fiche Locataire
                    </a>

                    <a
                      href={`/contracts`}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FileText size={13} />
                      Bail / Contrat
                    </a>
                  </div>
                </div>

                {/* ----------------------------------------------------------- */}
                {/* MESSAGES BODY STREAM */}
                {/* ----------------------------------------------------------- */}
                <div style={{
                  flex: 1,
                  padding: '20px 24px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#F8FAFC',
                  gap: '12px'
                }}>
                  {messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#94A3B8', padding: '40px 0' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                      }}>
                        <ShieldCheck size={24} />
                      </div>
                      <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9375rem' }}>
                        Démarrez la conversation en toute sérénité
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '380px', margin: '6px auto 0' }}>
                        Cette discussion est cryptée de bout en bout. Envoyez votre premier message ou utilisez l'un des modèles rapides ci-dessous.
                      </p>
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Date Divider Pill */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: '700',
                            color: '#64748B',
                            backgroundColor: '#E2E8F0',
                            padding: '3px 12px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {group.dateLabel}
                          </span>
                        </div>

                        {/* Group Messages */}
                        {group.items.map((m) => {
                          const isMe = m.senderRole !== 'tenant';
                          const timeStr = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const isEdited = m.updatedAt && new Date(m.updatedAt).getTime() > new Date(m.createdAt).getTime() + 5000;

                          return (
                            <div
                              key={m.id}
                              onMouseEnter={() => setHoveredMessageId(m.id)}
                              onMouseLeave={() => setHoveredMessageId(null)}
                              style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '72%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                position: 'relative'
                              }}
                            >
                              {/* Message bubble */}
                              <div style={{
                                padding: '11px 16px',
                                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                backgroundColor: isMe ? '#013E37' : '#FFFFFF',
                                color: isMe ? '#FFFFFF' : '#0F172A',
                                border: isMe ? 'none' : '1px solid #E2E8F0',
                                boxShadow: isMe ? '0 2px 4px rgba(1, 62, 55, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {m.content}
                              </div>

                              {/* Footer timestamp & status */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.6875rem',
                                color: '#94A3B8',
                                marginTop: '3px',
                                padding: '0 4px'
                              }}>
                                <span>{timeStr}</span>
                                {isEdited && <span style={{ fontStyle: 'italic' }}>&bull; modifié</span>}
                                {isMe && (
                                  <span title="Délivré et chiffré">
                                    <CheckCheck size={13} style={{ color: '#059669', marginLeft: '2px' }} />
                                  </span>
                                )}
                              </div>

                              {/* Hover Floating Actions Menu */}
                              {hoveredMessageId === m.id && (
                                <div style={{
                                  position: 'absolute',
                                  top: -12,
                                  right: isMe ? 8 : undefined,
                                  left: !isMe ? 8 : undefined,
                                  backgroundColor: '#FFFFFF',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '3px 4px',
                                  gap: '2px',
                                  zIndex: 10
                                }}>
                                  <button
                                    onClick={() => copyMessageText(m.content, m.id)}
                                    title="Copier le texte"
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px', borderRadius: '4px' }}
                                  >
                                    {copiedMessageId === m.id ? <Check size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
                                  </button>

                                  {isMe && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(m.id);
                                          setInput(m.content);
                                          if (inputRef.current) inputRef.current.focus();
                                        }}
                                        title="Modifier"
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px', borderRadius: '4px' }}
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => setDeleteTargetMessageId(m.id)}
                                        title="Supprimer"
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626', padding: '4px', borderRadius: '4px' }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ----------------------------------------------------------- */}
                {/* QUICK CANNED REPLIES STRIP (TEMPLATES) */}
                {/* ----------------------------------------------------------- */}
                <div style={{
                  padding: '8px 24px',
                  backgroundColor: '#FFFFFF',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Modèles rapides :
                  </span>
                  {cannedTemplates.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      onClick={() => handleApplyTemplate(tmpl.text)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ECFDF5';
                        e.currentTarget.style.borderColor = '#A7F3D0';
                        e.currentTarget.style.color = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.color = '#475569';
                      }}
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>

                {/* ----------------------------------------------------------- */}
                {/* INPUT BAR AREA */}
                {/* ----------------------------------------------------------- */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {/* Editing Notice Banner */}
                  {editingMessageId && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      backgroundColor: 'rgba(1, 62, 55, 0.08)',
                      borderRadius: '8px',
                      color: '#013E37',
                      fontSize: '0.8125rem',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Edit2 size={14} />
                        <span>Mode modification du message</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingMessageId(null);
                          setInput('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#013E37', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={handleSendMessage}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <input
                      ref={inputRef as any}
                      type="text"
                      placeholder={editingMessageId ? "Modifiez votre message et validez..." : `Écrire un message chiffré à ${selectedThread.tenantProfile?.firstName}...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        outline: 'none',
                        fontSize: '0.875rem',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        transition: 'border-color 0.15s ease'
                      }}
                    />

                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: !input.trim() || sending ? '#E2E8F0' : '#013E37',
                        color: !input.trim() || sending ? '#94A3B8' : '#FFFFFF',
                        cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: !input.trim() || sending ? 'none' : '0 2px 6px rgba(1, 62, 55, 0.25)'
                      }}
                      title="Envoyer (Entrée)"
                    >
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* EMPTY STATE */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '40px',
                textAlign: 'center',
                color: '#64748B'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(1, 62, 55, 0.08)',
                  color: '#013E37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <MessageSquare size={32} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Sélectionnez une conversation locataire
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '420px', margin: '8px 0 20px 0', lineHeight: 1.5 }}>
                  Choisissez une discussion dans la colonne de gauche ou lancez un nouvel échange avec l'un de vos locataires actifs.
                </p>
                <button
                  onClick={openNewChatModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#013E37',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  Démarrer une conversation
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: NOUVELLE CONVERSATION LOCATAIRE */}
      {/* ----------------------------------------------------------------- */}
      {showNewChatModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Démarrer une Nouvelle Conversation
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0 0' }}>
                  Sélectionnez un locataire pour ouvrir le canal chiffré
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, email..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Modal Tenants List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {loadingTenants ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  Chargement des locataires...
                </div>
              ) : (
                (() => {
                  const filtered = tenantProfiles.filter((tp) => {
                    const q = tenantSearch.toLowerCase().trim();
                    if (!q) return true;
                    const name = `${tp.firstName || ''} ${tp.lastName || ''}`.toLowerCase();
                    const phone = (tp.phone || '').toLowerCase();
                    const email = (tp.email || '').toLowerCase();
                    return name.includes(q) || phone.includes(q) || email.includes(q);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                        Aucun locataire trouvé.
                      </div>
                    );
                  }

                  return filtered.map((tp) => (
                    <div
                      key={tp.id}
                      onClick={() => handleStartConversationWithTenant(tp)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F0FDF4';
                        e.currentTarget.style.borderColor = '#A7F3D0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#013E37',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.8125rem'
                        }}>
                          {`${tp.firstName?.[0] || ''}${tp.lastName?.[0] || ''}`.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F172A' }}>
                            {tp.firstName} {tp.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            {tp.phone} {tp.email ? `&bull; ${tp.email}` : ''}
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#013E37' }}>
                        Ouvrir &rarr;
                      </span>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: CONFIRMATION DE SUPPRESSION DE MESSAGE */}
      {/* ----------------------------------------------------------------- */}
      {deleteTargetMessageId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={18} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Supprimer ce message ?
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Ce message sera définitivement effacé de la discussion pour vous et pour le locataire.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteTargetMessageId(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteMessage}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
