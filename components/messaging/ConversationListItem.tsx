/**
 * ConversationListItem Component
 * Displays individual conversation with visual indicators for unread messages
 * Requirements: 1.3, 1.4, 1.5, 2.1, 3.1, 3.2, 3.3
 */

import type { ConversationData } from '@/hooks/use-conversations';
import { UnreadBadge } from './UnreadBadge';

export interface ConversationListItemProps {
  conversation: ConversationData;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick
}: ConversationListItemProps) {
  const { otherUser, lastMessage, unreadCount } = conversation;
  const hasUnread = unreadCount > 0;

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for messages within 24 hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      // Show day of week for messages within a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Show date for older messages
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get last message preview
  const getMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';
    
    if (lastMessage.type === 'file') {
      return `📎 ${lastMessage.content}`;
    }
    
    return lastMessage.content;
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg text-left transition-all duration-300
        ${isActive ? 'border-2' : 'hover:border border'}
        ${hasUnread ? 'font-bold' : ''}
      `}
      style={{
        backgroundColor: hasUnread && !isActive
          ? 'var(--theme-accent-light, rgba(59, 130, 246, 0.1))'
          : isActive
          ? 'var(--theme-accent)'
          : 'transparent',
        borderColor: isActive ? 'var(--theme-accent)' : 'var(--theme-border)',
        color: isActive ? '#ffffff' : 'var(--theme-text)',
      }}
      aria-label={`Conversation with ${otherUser.name}${hasUnread ? `, ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : ''}`}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        {/* Profile Image */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
          {otherUser.avatar ? (
            <img 
              src={otherUser.avatar} 
              alt={otherUser.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            otherUser.name.split(' ').map(n => n[0]).join('')
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* User Name and Timestamp */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p 
              className={`truncate ${hasUnread ? 'font-bold' : 'font-semibold'} ${isActive ? 'text-white' : ''}`}
            >
              {otherUser.name}
            </p>
            {lastMessage && (
              <span 
                className={`text-xs flex-shrink-0 ${hasUnread ? 'font-semibold' : ''}`}
                style={{ 
                  color: isActive ? '#ffffff' : 'var(--theme-text)', 
                  opacity: isActive ? 0.8 : 0.6 
                }}
              >
                {formatTime(lastMessage.timestamp)}
              </span>
            )}
          </div>

          {/* Department */}
          <p 
            className={`text-xs truncate mb-1 ${isActive ? 'text-white' : ''}`}
            style={{ 
              color: isActive ? '#ffffff' : 'var(--theme-text)', 
              opacity: isActive ? 0.8 : 0.6 
            }}
          >
            {otherUser.department}
          </p>

          {/* Last Message Preview and Unread Badge */}
          <div className="flex items-center justify-between gap-2">
            <p 
              className={`text-sm truncate ${hasUnread ? 'font-semibold' : ''} ${isActive ? 'text-white' : ''}`}
              style={{ 
                color: isActive ? '#ffffff' : 'var(--theme-text)', 
                opacity: isActive ? 0.9 : 0.7 
              }}
            >
              {getMessagePreview()}
            </p>
            {hasUnread && (
              <div className="flex-shrink-0">
                <UnreadBadge count={unreadCount} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Online Status Indicator */}
        {otherUser.status === 'online' && (
          <div 
            className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
            aria-label="Online"
          />
        )}
      </div>
    </button>
  );
}
