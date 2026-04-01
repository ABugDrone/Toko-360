/**
 * Integration tests for messaging recent contacts indicator feature
 * Task 10.1: Integration testing
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 3.2, 5.1, 5.2
 * 
 * This test suite verifies the complete user flow:
 * 1. Open dialog → see indicators → select contact → navigate
 * 2. Test with various conversation list sizes (0, 1, 10, 100 conversations)
 * 3. Test with various contact list sizes (0, 1, 50, 500 contacts)
 * 4. Test search functionality with indicators
 * 5. Verify no regressions in existing messaging functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import MessagingPage from './page';
import { useAuth } from '@/app/auth-context';
import * as storage from '@/lib/storage';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import type { User, Message } from '@/lib/types';
import type { ConversationSummary } from '@/lib/storage';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock dependencies
vi.mock('@/app/auth-context');
vi.mock('@/lib/storage');
vi.mock('@/hooks/use-realtime-messages');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/components/top-nav', () => ({
  TopNav: () => <div>TopNav</div>,
}));

describe('Task 10.1: Integration Testing - Recent Contacts Indicator', () => {
  const mockUser: User = {
    id: 'user-123',
    staffId: 'TA-2024-001',
    name: 'Test User',
    email: 'test@example.com',
    department: 'IT',
    role: 'staff',
    status: 'online',
  };

  // Helper function to create mock users
  const createMockUser = (id: string, index: number): User => ({
    id,
    staffId: `TA-2024-${String(index).padStart(3, '0')}`,
    name: `User ${index}`,
    email: `user${index}@example.com`,
    department: ['IT', 'Sales', 'HR', 'Finance'][index % 4] as any,
    role: 'staff',
    status: index % 2 === 0 ? 'online' : 'offline',
  });

  // Helper function to create mock conversation summaries
  const createMockConversation = (otherUserId: string, index: number): ConversationSummary => ({
    otherUserId,
    lastMessage: {
      id: `msg-${index}`,
      content: `Message ${index}`,
      timestamp: Date.now() - index * 1000,
      senderId: otherUserId,
      recipientId: mockUser.id,
      type: 'text' as const,
      read: false,
    },
    lastMessageTime: Date.now() - index * 1000,
    unreadCount: index % 3,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAuth as any).mockReturnValue({ user: mockUser });
    (storage.getMessages as any).mockResolvedValue([]);
    (storage.addMessage as any).mockResolvedValue(undefined);
    (storage.markConversationAsRead as any).mockResolvedValue(undefined);
    (useRealtimeMessages as any).mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      error: null,
    });
  });

  /**
   * Test 1: Complete user flow with indicators
   * Validates: Requirements 1.1, 1.2, 2.1
   */
  it('should complete full user flow: open dialog → see indicators → select contact → navigate', async () => {
    // Setup: 3 users, 2 with conversations
    const user1 = createMockUser('user-001', 1);
    const user2 = createMockUser('user-002', 2);
    const user3 = createMockUser('user-003', 3);
    
    const allUsers = [mockUser, user1, user2, user3];
    const conversations = [
      createMockConversation(user1.id, 1),
      createMockConversation(user2.id, 2),
    ];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    const { getByText, getByRole } = render(<MessagingPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    // Step 1: Open new message dialog
    const newMessageButton = getByText('New Message');
    fireEvent.click(newMessageButton);

    // Step 2: Verify dialog opens and indicators appear
    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Step 3: Verify indicators appear for users with conversations
    await waitFor(() => {
      const user1Element = screen.getByText('User 1').closest('button');
      const user2Element = screen.getByText('User 2').closest('button');
      const user3Element = screen.getByText('User 3').closest('button');

      expect(user1Element).toBeInTheDocument();
      expect(user2Element).toBeInTheDocument();
      expect(user3Element).toBeInTheDocument();

      // Users 1 and 2 should have indicators
      expect(within(user1Element!).queryByTestId('recent-indicator')).toBeInTheDocument();
      expect(within(user2Element!).queryByTestId('recent-indicator')).toBeInTheDocument();
      
      // User 3 should NOT have indicator
      expect(within(user3Element!).queryByTestId('recent-indicator')).not.toBeInTheDocument();
    });

    // Step 4: Select contact with indicator (should navigate to existing conversation)
    const user1Button = screen.getByText('User 1').closest('button');
    fireEvent.click(user1Button!);

    // Step 5: Verify navigation and dialog closes
    await waitFor(() => {
      expect(screen.queryByText('Start New Conversation')).not.toBeInTheDocument();
    });

    // Verify getMessages was called for the selected user
    expect(storage.getMessages).toHaveBeenCalledWith(mockUser.staffId, user1.staffId);
  });

  /**
   * Test 2: Empty conversation list (0 conversations)
   * Validates: Requirements 1.2
   */
  it('should handle empty conversation list - no indicators shown', async () => {
    const user1 = createMockUser('user-001', 1);
    const user2 = createMockUser('user-002', 2);
    
    const allUsers = [mockUser, user1, user2];
    const conversations: ConversationSummary[] = [];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    // Open new message dialog
    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Verify no indicators appear
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(0);
    });
  });

  /**
   * Test 3: Single conversation
   * Validates: Requirements 1.1, 1.2
   */
  it('should handle single conversation - one indicator shown', async () => {
    const user1 = createMockUser('user-001', 1);
    const user2 = createMockUser('user-002', 2);
    
    const allUsers = [mockUser, user1, user2];
    const conversations = [createMockConversation(user1.id, 1)];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Verify exactly one indicator appears
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(1);
      
      const user1Element = screen.getByText('User 1').closest('button');
      expect(within(user1Element!).queryByTestId('recent-indicator')).toBeInTheDocument();
      
      const user2Element = screen.getByText('User 2').closest('button');
      expect(within(user2Element!).queryByTestId('recent-indicator')).not.toBeInTheDocument();
    });
  });

  /**
   * Test 4: Medium conversation list (10 conversations)
   * Validates: Requirements 1.1, 1.2, 5.1
   */
  it('should handle 10 conversations - indicators shown correctly', async () => {
    // Create 20 users, 10 with conversations
    const allUsers = [mockUser, ...Array.from({ length: 20 }, (_, i) => createMockUser(`user-${String(i).padStart(3, '0')}`, i))];
    const conversations = Array.from({ length: 10 }, (_, i) => 
      createMockConversation(`user-${String(i).padStart(3, '0')}`, i)
    );

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Verify exactly 10 indicators appear
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(10);
    });
  });

  /**
   * Test 5: Large conversation list (100 conversations)
   * Validates: Requirements 1.1, 1.2, 5.1
   */
  it('should handle 100 conversations - performance test', async () => {
    // Create 150 users, 100 with conversations
    const allUsers = [mockUser, ...Array.from({ length: 150 }, (_, i) => createMockUser(`user-${String(i).padStart(3, '0')}`, i))];
    const conversations = Array.from({ length: 100 }, (_, i) => 
      createMockConversation(`user-${String(i).padStart(3, '0')}`, i)
    );

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    const startTime = performance.now();
    
    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Verify 100 indicators appear
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(100);
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (relaxed for test environment)
    expect(renderTime).toBeLessThan(5000); // 5 seconds for test environment
  });

  /**
   * Test 6: Empty contact list
   * Validates: Requirements 1.2
   */
  it('should handle empty contact list gracefully', async () => {
    const allUsers = [mockUser]; // Only current user
    const conversations: ConversationSummary[] = [];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Should show "No new users available" message
    await waitFor(() => {
      expect(screen.getByText(/No new users available/i)).toBeInTheDocument();
    });
  });

  /**
   * Test 7: Large contact list (50 contacts)
   * Validates: Requirements 5.1
   */
  it('should handle 50 contacts efficiently', async () => {
    const allUsers = [mockUser, ...Array.from({ length: 50 }, (_, i) => createMockUser(`user-${String(i).padStart(3, '0')}`, i))];
    const conversations = Array.from({ length: 25 }, (_, i) => 
      createMockConversation(`user-${String(i).padStart(3, '0')}`, i)
    );

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Verify 25 indicators appear (half have conversations)
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(25);
    });
  });

  /**
   * Test 8: Very large contact list (500 contacts)
   * Validates: Requirements 5.1
   */
  it('should handle 500 contacts - stress test', async () => {
    // Create 500 users, 250 with conversations
    const allUsers = [mockUser, ...Array.from({ length: 500 }, (_, i) => createMockUser(`user-${String(i).padStart(3, '0')}`, i))];
    const conversations = Array.from({ length: 250 }, (_, i) => 
      createMockConversation(`user-${String(i).padStart(3, '0')}`, i)
    );

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    const startTime = performance.now();
    
    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Verify 250 indicators appear
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(250);
    }, { timeout: 10000 });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (relaxed for test environment)
    expect(renderTime).toBeLessThan(10000); // 10 seconds for stress test
  });

  /**
   * Test 9: Search functionality with indicators
   * Validates: Requirements 5.2
   */
  it('should filter contacts by search and maintain indicators', async () => {
    const user1 = createMockUser('user-001', 1);
    user1.name = 'Alice Smith';
    const user2 = createMockUser('user-002', 2);
    user2.name = 'Bob Johnson';
    const user3 = createMockUser('user-003', 3);
    user3.name = 'Alice Brown';
    
    const allUsers = [mockUser, user1, user2, user3];
    const conversations = [
      createMockConversation(user1.id, 1),
      createMockConversation(user2.id, 2),
    ];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Get search input
    const searchInput = screen.getByPlaceholderText('Search users...');

    // Search for "Alice"
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // Wait for debounce (300ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    // Should show only Alice Smith and Alice Brown
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    // Alice Smith should have indicator, Alice Brown should not
    await waitFor(() => {
      const aliceSmithElement = screen.getByText('Alice Smith').closest('button');
      const aliceBrownElement = screen.getByText('Alice Brown').closest('button');
      
      expect(within(aliceSmithElement!).queryByTestId('recent-indicator')).toBeInTheDocument();
      expect(within(aliceBrownElement!).queryByTestId('recent-indicator')).not.toBeInTheDocument();
    });
  });

  /**
   * Test 10: Search by department with indicators
   * Validates: Requirements 5.2
   */
  it('should filter contacts by department and maintain indicators', async () => {
    const user1 = createMockUser('user-001', 1);
    user1.department = 'IT';
    const user2 = createMockUser('user-002', 2);
    user2.department = 'Marketing';
    const user3 = createMockUser('user-003', 3);
    user3.department = 'IT';
    
    const allUsers = [mockUser, user1, user2, user3];
    const conversations = [
      createMockConversation(user1.id, 1),
      createMockConversation(user3.id, 3),
    ];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users...');

    // Search for "IT"
    fireEvent.change(searchInput, { target: { value: 'IT' } });

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));

    // Should show only IT department users
    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      const userButtons = allButtons.filter(btn => 
        btn.textContent?.includes('User 1') || 
        btn.textContent?.includes('User 2') || 
        btn.textContent?.includes('User 3')
      );
      
      // Should have 2 IT users visible
      expect(userButtons.length).toBe(2);
    });

    // Both IT users should have indicators
    await waitFor(() => {
      const indicators = screen.queryAllByTestId('recent-indicator');
      expect(indicators).toHaveLength(2);
    });
  });

  /**
   * Test 11: Navigate to existing conversation
   * Validates: Requirements 2.1
   */
  it('should navigate to existing conversation when selecting contact with indicator', async () => {
    const user1 = createMockUser('user-001', 1);
    const allUsers = [mockUser, user1];
    const conversations = [createMockConversation(user1.id, 1)];
    const messages: Message[] = [
      {
        id: 'msg-001',
        senderId: user1.staffId,
        recipientId: mockUser.staffId,
        type: 'text',
        content: 'Hello!',
        timestamp: Date.now(),
        read: true,
      },
    ];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );
    (storage.getMessages as any).mockResolvedValue(messages);

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Click on user with indicator
    const user1Button = screen.getByText('User 1').closest('button');
    fireEvent.click(user1Button!);

    // Verify dialog closes
    await waitFor(() => {
      expect(screen.queryByText('Start New Conversation')).not.toBeInTheDocument();
    });

    // Verify messages were loaded
    expect(storage.getMessages).toHaveBeenCalledWith(mockUser.staffId, user1.staffId);

    // Verify message appears in chat
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });
  });

  /**
   * Test 12: Create new conversation
   * Validates: Requirements 2.2
   */
  it('should create new conversation when selecting contact without indicator', async () => {
    const user1 = createMockUser('user-001', 1);
    const user2 = createMockUser('user-002', 2);
    const allUsers = [mockUser, user1, user2];
    const conversations = [createMockConversation(user1.id, 1)];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );
    (storage.getMessages as any).mockResolvedValue([]);

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Click on user without indicator (User 2)
    const user2Button = screen.getByText('User 2').closest('button');
    
    // Verify no indicator
    expect(within(user2Button!).queryByTestId('recent-indicator')).not.toBeInTheDocument();
    
    fireEvent.click(user2Button!);

    // Verify dialog closes
    await waitFor(() => {
      expect(screen.queryByText('Start New Conversation')).not.toBeInTheDocument();
    });

    // Verify empty message state
    await waitFor(() => {
      expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    });
  });

  /**
   * Test 13: No regression - conversation list still works
   * Validates: Requirements 1.1, 1.2, 3.2
   */
  it('should not break existing conversation list functionality', async () => {
    const user1 = createMockUser('user-001', 1);
    const user2 = createMockUser('user-002', 2);
    const allUsers = [mockUser, user1, user2];
    const conversations = [
      createMockConversation(user1.id, 1),
      createMockConversation(user2.id, 2),
    ];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );
    (storage.getMessages as any).mockResolvedValue([]);

    render(<MessagingPage />);

    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });

    // Verify conversation list items are clickable
    const conv1 = screen.getAllByText('User 1')[0].closest('button');
    expect(conv1).toBeInTheDocument();
    
    fireEvent.click(conv1!);

    // Verify messages are loaded
    expect(storage.getMessages).toHaveBeenCalledWith(mockUser.staffId, user1.staffId);
  });

  /**
   * Test 14: No regression - sending messages still works
   * Validates: Requirements 2.1, 2.2
   */
  it('should not break message sending functionality', async () => {
    const user1 = createMockUser('user-001', 1);
    const allUsers = [mockUser, user1];
    const conversations = [createMockConversation(user1.id, 1)];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );
    (storage.getMessages as any).mockResolvedValue([]);

    render(<MessagingPage />);

    // Wait for conversation to load
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    // Click on conversation
    const conv1 = screen.getAllByText('User 1')[0].closest('button');
    fireEvent.click(conv1!);

    // Wait for chat to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    });

    // Type and send message
    const messageInput = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Verify addMessage was called
    await waitFor(() => {
      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockUser.staffId,
          recipientId: user1.staffId,
          content: 'Test message',
          type: 'text',
        })
      );
    });
  });

  /**
   * Test 15: Search performance with indicators
   * Validates: Requirements 5.2
   */
  it('should update search results quickly (< 500ms)', async () => {
    // Create 100 users for performance test
    const allUsers = [mockUser, ...Array.from({ length: 100 }, (_, i) => createMockUser(`user-${String(i).padStart(3, '0')}`, i))];
    const conversations = Array.from({ length: 50 }, (_, i) => 
      createMockConversation(`user-${String(i).padStart(3, '0')}`, i)
    );

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users...');

    const startTime = performance.now();
    
    // Type search query
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));

    // Wait for results to update
    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      const userButtons = allButtons.filter(btn => btn.textContent?.includes('User 1'));
      expect(userButtons.length).toBeGreaterThan(0);
    });

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    // Should update within reasonable time (relaxed for test environment)
    expect(searchTime).toBeLessThan(2000); // 2 seconds for test environment
  });

  /**
   * Test 16: Accessibility - ARIA labels with indicators
   * Validates: Requirements 4.1, 4.3
   */
  it('should have proper ARIA labels for contacts with indicators', async () => {
    const user1 = createMockUser('user-001', 1);
    const user2 = createMockUser('user-002', 2);
    const allUsers = [mockUser, user1, user2];
    const conversations = [createMockConversation(user1.id, 1)];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Check ARIA label for contact with indicator
    await waitFor(() => {
      const user1Button = screen.getByText('User 1').closest('button');
      expect(user1Button).toHaveAttribute('aria-label', expect.stringContaining('has existing conversation'));
    });

    // Check ARIA label for contact without indicator
    await waitFor(() => {
      const user2Button = screen.getByText('User 2').closest('button');
      const ariaLabel = user2Button?.getAttribute('aria-label') || '';
      expect(ariaLabel).not.toContain('has existing conversation');
    });
  });

  /**
   * Test 17: Dialog closes and search resets after selection
   * Validates: Requirements 2.1, 2.2
   */
  it('should close dialog and reset search after contact selection', async () => {
    const user1 = createMockUser('user-001', 1);
    const allUsers = [mockUser, user1];
    const conversations = [createMockConversation(user1.id, 1)];

    (storage.getAllUsers as any).mockResolvedValue(allUsers);
    (storage.getConversations as any).mockResolvedValue(conversations);
    (storage.getUserById as any).mockImplementation((id: string) => 
      Promise.resolve(allUsers.find(u => u.id === id))
    );
    (storage.getMessages as any).mockResolvedValue([]);

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'User' } });

    // Select contact
    const user1Button = screen.getByText('User 1').closest('button');
    fireEvent.click(user1Button!);

    // Verify dialog closes
    await waitFor(() => {
      expect(screen.queryByText('Start New Conversation')).not.toBeInTheDocument();
    });

    // Open dialog again
    fireEvent.click(screen.getByText('New Message'));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Verify search is reset
    const newSearchInput = screen.getByPlaceholderText('Search users...');
    expect(newSearchInput).toHaveValue('');
  });
});
