/**
 * Bug Condition Exploration Tests for Login Freeze Fix
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { useAuth } from './auth-context';
import { useRouter } from 'next/navigation';
import { getAllUsers } from '@/lib/storage';

// Mock Supabase first
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

// Mock theme context
vi.mock('./theme-context', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// Mock dependencies
vi.mock('./auth-context');
vi.mock('next/navigation');
vi.mock('@/lib/storage');
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('LoginPage - Bug Condition Exploration', () => {
  let mockLogin: ReturnType<typeof vi.fn>;
  let mockPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLogin = vi.fn();
    mockPush = vi.fn();

    (useAuth as any).mockReturnValue({
      login: mockLogin,
    });

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    (getAllUsers as any).mockResolvedValue([]);
  });

  /**
   * Simple unit test to verify basic functionality
   */
  it('should render login form', () => {
    render(<LoginPage />);
    
    const staffIdInput = screen.getByPlaceholderText('Enter your unique ID');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /SIGN IN TO PORTAL/i });

    expect(staffIdInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  /**
   * Property 1: Fault Condition - UI Feedback and Navigation After Login (Valid Credentials)
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * This is a CRITICAL exploration test that MUST FAIL on unfixed code.
   * 
   * For any login submission with valid credentials where authentication completes successfully,
   * the UI MUST navigate to the dashboard AND clear the loading state.
   * 
   * Bug condition: staffId and password are not empty, form is submitted,
   * authentication succeeds, but navigation does NOT occur.
   */
  it('Property 1: UI navigates to dashboard after successful login', async () => {
    // Setup: Mock successful authentication - return a user object
    const mockUser = {
      id: '1',
      staffId: 'TA-2024-001',
      name: 'Test User',
      email: 'test@toko.edu',
      department: 'IT' as const,
      role: 'staff' as const,
    };
    mockLogin.mockResolvedValue(mockUser);

    // Render the login page
    render(<LoginPage />);

    // Find form inputs
    const staffIdInput = screen.getByPlaceholderText('Enter your unique ID');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /SIGN IN TO PORTAL/i });

    // Fill in credentials
    fireEvent.change(staffIdInput, { target: { value: 'TA-2024-001' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    // Wait for authentication to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('TA-2024-001', 'password123');
    }, { timeout: 2000 });

    // CRITICAL ASSERTION: Navigation MUST occur for valid credentials
    // This will FAIL on unfixed code, confirming the bug exists
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      },
      { timeout: 3000 }
    );

    // CRITICAL ASSERTION: Loading state MUST be cleared
    await waitFor(() => {
      const button = screen.queryByText(/SIGNING IN/i);
      expect(button).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  /**
   * Property 1: Fault Condition - UI Feedback and Navigation After Login (Invalid Credentials)
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * This is a CRITICAL exploration test that MUST FAIL on unfixed code.
   * 
   * For any login submission with invalid credentials where authentication fails,
   * the UI MUST display an error message AND clear the loading state.
   * 
   * Bug condition: staffId and password are not empty, form is submitted,
   * authentication fails, but error message is NOT displayed.
   */
  it('Property 1: UI displays error message after failed login', async () => {
    // Setup: Mock failed authentication
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue(new Error(errorMessage));

    // Render the login page
    render(<LoginPage />);

    // Find form inputs
    const staffIdInput = screen.getByPlaceholderText('Enter your unique ID');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /SIGN IN TO PORTAL/i });

    // Fill in credentials
    fireEvent.change(staffIdInput, { target: { value: 'INVALID-ID' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    // Submit form
    fireEvent.click(submitButton);

    // Wait for authentication to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('INVALID-ID', 'wrongpass');
    }, { timeout: 2000 });

    // CRITICAL ASSERTION: Error message MUST be displayed for invalid credentials
    // This will FAIL on unfixed code, confirming the bug exists
    await waitFor(
      () => {
        const errorText = screen.getByText(/Invalid credentials|Authentication failed|Unable to connect/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // CRITICAL ASSERTION: Loading state MUST be cleared
    await waitFor(() => {
      const button = screen.queryByText(/SIGNING IN/i);
      expect(button).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // CRITICAL ASSERTION: Navigation MUST NOT occur for invalid credentials
    expect(mockPush).not.toHaveBeenCalled();
  });
});
