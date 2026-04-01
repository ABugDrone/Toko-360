'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TopNav } from '@/components/top-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth-context';
import { getMessages, addMessage, getAllUsers, markMessageAsRead, clearChat, markConversationAsRead } from '@/lib/storage';
import { Search, Send, Phone, Video, Info, Paperclip, Smile, Loader2, X, Trash2 } from 'lucide-react';
import type { Message, User } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { useConversations } from '@/hooks/use-conversations';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { RecentIndicator } from '@/components/messaging/RecentIndicator';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function MessagingPage() {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Debounced refresh function (max 1 refresh per second)
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      return; // Already scheduled
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      refreshTimeoutRef.current = null;
    }, 1000);
  }, []);

  // Debounce search input (300ms delay) for performance optimization
  useEffect(() => {
    // Clear existing timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new timeout
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    // Cleanup on unmount or when searchQuery changes
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Use conversations hook to get real conversation data
  const { 
    conversations, 
    totalUnreadCount, 
    isLoading: isLoadingConversations,
    error: conversationsError,
    refreshConversations 
  } = useConversations({ 
    userId: user?.staffId,
    refreshTrigger 
  });

  // Create memoized set of user IDs with existing conversations for O(1) lookup
  // Error handling: if conversation data fails to load, return empty Set (fail safe - show no indicators)
  const existingConversationUserIds = useMemo(() => {
    try {
      if (conversationsError) {
        console.error('Conversation data load failed, showing no indicators:', conversationsError);
        return new Set<string>();
      }
      return new Set(conversations.map(conv => conv.otherUser.id));
    } catch (error) {
      console.error('Failed to create conversation lookup:', error);
      return new Set<string>(); // Empty set - no indicators shown
    }
  }, [conversations, conversationsError]);

  // Set initial selected conversation
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  
  // Handle new conversations (temporary IDs starting with 'conv-new-')
  let otherUser: User | null | undefined;
  if (selectedConvId?.startsWith('conv-new-')) {
    // Extract user ID from temporary conversation ID
    const otherUserId = selectedConvId.replace('conv-new-', '');
    otherUser = allUsers.find(u => u.id === otherUserId);
  } else {
    // Existing conversation
    otherUser = selectedConv?.otherUser;
  }

  // Handle new messages from real-time subscription
  const handleNewMessage = useCallback((newMessage: Message) => {
    // Refresh conversations to update unread counts and sorting (debounced)
    debouncedRefresh();
    
    // Only add if it's part of the current conversation
    if (otherUser && (newMessage.senderId === otherUser.staffId || newMessage.recipientId === otherUser.staffId)) {
      setMessages(prev => {
        // Remove any temporary optimistic messages
        const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'));
        
        // Check if message already exists to avoid duplicates
        if (withoutTemp.some(m => m.id === newMessage.id)) {
          return prev;
        }
        
        return [...withoutTemp, newMessage].sort((a, b) => a.timestamp - b.timestamp);
      });

      // Mark as read if it's for the current user and they're viewing the conversation
      if (newMessage.recipientId === user?.staffId && !newMessage.read) {
        markMessageAsRead(newMessage.id).catch(error => {
          console.error('Failed to mark message as read:', error);
        });
      }
    }
  }, [otherUser?.staffId, user?.staffId, debouncedRefresh]);

  // Handle read status updates from real-time subscription
  const handleMessageRead = useCallback((messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  }, []);

  // Set up real-time subscription
  const connectionStatus = useRealtimeMessages({
    userId: user?.staffId,
    onNewMessage: handleNewMessage,
    onMessageRead: handleMessageRead,
  });

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        console.error('Failed to load users:', dbError.message);
        // Don't show error toast for user list - not critical for messaging
      }
    };
    loadUsers();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (otherUser && user?.staffId) {
        setIsLoading(true);
        try {
          const msgs = await getMessages(user.staffId, otherUser.staffId);
          setMessages(msgs);
          
          // Mark conversation as read when opening it
          if (selectedConv && selectedConv.unreadCount > 0) {
            try {
              await markConversationAsRead(user.id, otherUser.id);
              // Refresh conversations to update unread counts
              setRefreshTrigger(prev => prev + 1);
            } catch (error) {
              console.error('Failed to mark conversation as read:', error);
            }
          }
        } catch (error: any) {
          const dbError = mapDatabaseError(error);
          showErrorToast(dbError, {
            onRetry: () => loadMessages(),
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setMessages([]);
      }
    };
    
    loadMessages();
  }, [otherUser?.staffId, user?.staffId, user?.id, selectedConv?.unreadCount]); // Depend on staffIds and user.id

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedFile) || !otherUser || !user?.staffId) return;

    // Store values before clearing
    const textToSend = messageText.trim();
    const fileToSend = selectedFile;
    
    // Clear input and file immediately for better UX
    setMessageText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsSending(true);
    try {
      // If there's a file, convert it to base64
      let fileUrl: string | undefined;
      if (fileToSend) {
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileToSend);
        });
        fileUrl = fileData;
      }

      const newMsg = {
        senderId: user.staffId,
        recipientId: otherUser.staffId,
        type: fileToSend ? 'file' as const : 'text' as const,
        content: textToSend || fileToSend?.name || '',
        fileUrl,
        read: false,
      };

      // Optimistic UI update - add message immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.staffId,
        recipientId: otherUser.staffId,
        type: newMsg.type,
        content: newMsg.content,
        fileUrl: newMsg.fileUrl,
        timestamp: Date.now(),
        read: false,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      // Send to database
      await addMessage(newMsg);
      
      // Real-time subscription will replace the optimistic message with the real one
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => {
          // Restore the message text and file for retry
          setMessageText(textToSend);
          setSelectedFile(fileToSend);
        },
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast({
          message: 'File size must be less than 5MB',
          code: 'FILE_TOO_LARGE',
          details: null,
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConversationSelect = async (convId: string) => {
    setSelectedConvId(convId);
    const conv = conversations.find(c => c.id === convId);
    if (conv && user?.staffId) {
      setIsLoading(true);
      try {
        const msgs = await getMessages(user.staffId, conv.otherUser.staffId);
        setMessages(msgs);
        
        // Mark conversation as read
        if (conv.unreadCount > 0) {
          try {
            await markConversationAsRead(user.id, conv.otherUser.id);
            // Refresh conversations to update unread counts
            setRefreshTrigger(prev => prev + 1);
          } catch (error) {
            console.error('Failed to mark conversation as read:', error);
          }
        }
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get all users except current user
  const getAvailableUsers = () => {
    if (!user?.id) return [];
    
    // Filter out only the current user
    return allUsers.filter(u => u.id !== user.id);
  };

  // Filter available users by search query (using debounced query for performance)
  const filteredAvailableUsers = getAvailableUsers().filter(u =>
    u.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  // Start a new conversation with a user
  const handleStartConversation = async (selectedUser: User) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.otherUser.id === selectedUser.id);
      
      if (existingConv) {
        // Navigate to existing conversation
        setSelectedConvId(existingConv.id);
        
        // Load messages immediately
        if (user?.staffId) {
          setIsLoading(true);
          try {
            const msgs = await getMessages(user.staffId, existingConv.otherUser.staffId);
            setMessages(msgs);
            
            // Mark conversation as read
            if (existingConv.unreadCount > 0) {
              try {
                await markConversationAsRead(user.id, existingConv.otherUser.id);
                // Refresh conversations to update unread counts
                setRefreshTrigger(prev => prev + 1);
              } catch (error) {
                console.error('Failed to mark conversation as read:', error);
              }
            }
          } catch (error: any) {
            const dbError = mapDatabaseError(error);
            showErrorToast(dbError);
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        // Create temporary conversation ID for new conversation
        const newConvId = `conv-new-${selectedUser.id}`;
        setSelectedConvId(newConvId);
        
        // Clear messages array
        setMessages([]);
      }
      
      // Close dialog and reset search
      setIsNewMessageDialogOpen(false);
      setSearchQuery('');
    } catch (error) {
      // Handle any unexpected errors in conversation navigation
      console.error('Failed to start conversation:', error);
      showErrorToast({
        message: 'Failed to open conversation. Please try again.',
        code: 'CONVERSATION_NAV_ERROR',
        details: error,
      });
      // Keep dialog open on error so user can retry
    }
  };

  // Clear chat conversation
  const handleClearChat = async () => {
    if (!otherUser || !user?.staffId) return;
    
    if (!confirm(`Are you sure you want to clear all messages with ${otherUser.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await clearChat(user.staffId, otherUser.staffId);
      setMessages([]);
      showSuccessToast('Chat cleared successfully');
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError);
    }
  };

  return (
    <>
      <TopNav title="Messaging" searchPlaceholder="Search contacts..." />
      <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)' }}>
        {/* Conversations Sidebar */}
        <div className="w-80 border-r flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          {/* Header */}
          <div className="p-4 border-b transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Messages</h2>
              {/* Connection Status Indicator */}
              <ConnectionStatus
                status={
                  connectionStatus.isConnected
                    ? 'online'
                    : connectionStatus.isReconnecting
                    ? 'reconnecting'
                    : 'offline'
                }
                showLabel={true}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }} />
              <Input
                type="text"
                placeholder="Search contacts..."
                className="pl-10 transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center h-32" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading conversations...</p>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 p-4 text-center" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                <p className="text-sm mb-2">No conversations yet</p>
                <p className="text-xs">Start a conversation by clicking the "New Message" button below</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationListItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === selectedConvId}
                  onClick={() => handleConversationSelect(conv.id)}
                />
              ))
            )}
          </div>

          {/* New Message Button */}
          <div className="p-4 border-t transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
            <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full font-bold rounded-lg transition-all duration-300" style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}>
                  <span className="mr-2">+</span> New Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: 'var(--theme-text)' }}>Start New Conversation</DialogTitle>
                  <DialogDescription style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                    Select a user to start messaging
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-text)', opacity: 0.5 }} />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 transition-colors duration-300"
                      style={{
                        backgroundColor: 'var(--theme-background)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                    />
                  </div>

                  {/* Available Users List */}
                  <ErrorBoundary
                    fallback={
                      <div className="text-center py-4" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                        <p className="mb-2">Unable to load contacts</p>
                        <p className="text-xs">Please try again later</p>
                      </div>
                    }
                  >
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {filteredAvailableUsers.length === 0 ? (
                        <p className="text-center py-4" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                          {searchQuery ? 'No users found' : 'No new users available'}
                        </p>
                      ) : (
                        filteredAvailableUsers.map((availableUser) => {
                          const hasExistingConversation = existingConversationUserIds.has(availableUser.id);
                          
                          return (
                            <button
                              key={availableUser.id}
                              onClick={() => handleStartConversation(availableUser)}
                              className="w-full p-3 rounded-lg text-left transition-all duration-300 hover:border border"
                              style={{
                                backgroundColor: 'transparent',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text)',
                              }}
                              aria-label={`${availableUser.name}, ${availableUser.department}${hasExistingConversation ? ', has existing conversation' : ''}`}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="flex items-center gap-3">
                                {/* Profile Image */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                                  {availableUser.avatar ? (
                                    <img src={availableUser.avatar} alt={availableUser.name} className="w-full h-full object-cover" />
                                  ) : (
                                    availableUser.name.split(' ').map(n => n[0]).join('')
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">{availableUser.name}</p>
                                  <p className="text-xs truncate" style={{ opacity: 0.6 }}>
                                    {availableUser.department}
                                  </p>
                                </div>
                                {availableUser.status === 'online' && (
                                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                )}
                                {hasExistingConversation && <RecentIndicator size="sm" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ErrorBoundary>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {otherUser ? (
            <>
              {/* Chat Header */}
              <div className="border-b px-6 py-4 flex items-center justify-between transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                <div className="flex items-center gap-3">
                  {/* Profile Image */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {otherUser.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      otherUser.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <div>
                    {/* Only show name - NO Staff ID */}
                    <p className="font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{otherUser.name}</p>
                    {/* Show department and online status */}
                    <p className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>{otherUser.department}</p>
                    <p className={`text-xs ${otherUser.status === 'online' ? 'text-green-400' : ''}`} style={{ color: otherUser.status === 'online' ? '#4ade80' : 'var(--theme-text)', opacity: otherUser.status === 'online' ? 1 : 0.6 }}>
                      {otherUser.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                    <Info className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleClearChat}
                    className="p-2 rounded-lg transition-all duration-300 hover:scale-105 hover:text-red-500" 
                    style={{ color: 'var(--theme-text)', opacity: 0.7 }}
                    title="Clear chat"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.staffId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === user?.staffId
                            ? 'border'
                            : 'border'
                        }`}
                        style={{
                          backgroundColor: msg.senderId === user?.staffId ? 'var(--theme-accent)' : 'var(--theme-surface)',
                          color: msg.senderId === user?.staffId ? '#ffffff' : 'var(--theme-text)',
                          borderColor: msg.senderId === user?.staffId ? 'var(--theme-accent)' : 'var(--theme-border)',
                        }}
                      >
                        {/* File attachment */}
                        {msg.type === 'file' && msg.fileUrl && (
                          <div className="mb-2">
                            {msg.fileUrl.startsWith('data:image') ? (
                              <img 
                                src={msg.fileUrl} 
                                alt={msg.content}
                                className="max-w-full rounded cursor-pointer"
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                              />
                            ) : (
                              <a
                                href={msg.fileUrl}
                                download={msg.content}
                                className="flex items-center gap-2 p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: msg.senderId === user?.staffId ? 'rgba(255,255,255,0.1)' : 'var(--theme-background)' }}
                              >
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm truncate">{msg.content}</span>
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Text content */}
                        {msg.content && msg.type === 'text' && (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        
                        <p className={`text-xs mt-1 ${msg.senderId === user?.staffId ? 'opacity-70' : ''}`} style={{ color: msg.senderId === user?.staffId ? '#ffffff' : 'var(--theme-text)', opacity: msg.senderId === user?.staffId ? 0.7 : 0.5 }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="mb-3 p-3 rounded-lg border flex items-center justify-between transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}>
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                      <span className="text-sm truncate max-w-xs" style={{ color: 'var(--theme-text)' }}>
                        {selectedFile.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded hover:bg-opacity-10 transition-colors"
                      style={{ color: 'var(--theme-text)', opacity: 0.7 }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    className="p-2 rounded-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
                    style={{ color: 'var(--theme-text)', opacity: 0.7 }}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--theme-background)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                  <button
                    type="button"
                    className="p-2 rounded-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
                    style={{ color: 'var(--theme-text)', opacity: 0.7 }}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <Button
                    type="submit"
                    disabled={isSending || (!messageText.trim() && !selectedFile)}
                    className="px-4 rounded-lg transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: '#ffffff',
                    }}
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
