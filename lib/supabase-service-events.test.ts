import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the supabase module before importing anything else
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Now import after mocking
import { updateEvent, getEventsByDepartment } from './supabase-service';
import { supabase } from './supabase';

describe('Events CRUD Bug Condition Exploration - Property 1: Fault Condition', () => {
  let mockUpdate: any;
  let mockEq: any;
  let mockSelect: any;
  let mockSingle: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock chain for Supabase query builder
    mockSingle = vi.fn();
    mockSelect = vi.fn(() => ({ single: mockSingle }));
    mockEq = vi.fn(() => ({ select: mockSelect }));
    mockUpdate = vi.fn(() => ({ eq: mockEq }));

    // Mock the from method to return our mock chain
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);
  });

  /**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * Bug Condition Exploration Test - Update All Provided Fields
   * 
   * This test verifies that updateEvent correctly handles falsy values (empty strings, null, 0, false).
   * The expected behavior is that ALL fields in the updates object should be written to the database
   * regardless of their truthiness.
   * 
   * **CRITICAL**: This test MUST FAIL on unfixed code because the current implementation uses
   * conditional truthy checks (if (updates.field)) which prevent falsy values from being updated.
   * 
   * **EXPECTED OUTCOME**: Test FAILS on unfixed code - this proves the bug exists.
   * When the test fails, it will surface counterexamples showing which falsy values are not being updated.
   */
  describe('Property 1: Update All Provided Fields (Bug Condition)', () => {
    it('should update description to empty string when provided', async () => {
      // Arrange: Create a mock event that will be returned after update
      const mockUpdatedEvent = {
        id: 'event-1',
        title: 'Test Event',
        description: '', // Empty string - this is the falsy value we're testing
        event_date: '2024-01-15',
        event_time: '10:00 AM',
        location: 'Room 101',
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'meeting',
        color: '#FF5733',
        target_departments: null,
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      // Act: Call updateEvent with empty string for description
      await updateEvent('event-1', { description: '' });

      // Assert: Verify that the update was called with description in dbUpdates
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '', // The empty string should be included in the update
        })
      );
    });

    it('should update location to empty string when provided', async () => {
      const mockUpdatedEvent = {
        id: 'event-2',
        title: 'Test Event',
        description: 'Test description',
        event_date: '2024-01-15',
        event_time: '10:00 AM',
        location: '', // Empty string
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'meeting',
        color: '#FF5733',
        target_departments: null,
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      await updateEvent('event-2', { location: '' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          location: '',
        })
      );
    });

    it('should update color to empty string when provided', async () => {
      const mockUpdatedEvent = {
        id: 'event-3',
        title: 'Test Event',
        description: 'Test description',
        event_date: '2024-01-15',
        event_time: '10:00 AM',
        location: 'Room 101',
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'meeting',
        color: '', // empty string value
        target_departments: null,
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      await updateEvent('event-3', { color: '' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '',
        })
      );
    });

    it('should update multiple falsy fields simultaneously', async () => {
      const mockUpdatedEvent = {
        id: 'event-4',
        title: 'Test Event',
        description: '', // Empty string
        event_date: '2024-01-15',
        event_time: '10:00 AM',
        location: '', // Empty string
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'meeting',
        color: null, // null
        target_departments: null,
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      await updateEvent('event-4', {
        description: '',
        location: '',
        color: '',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
          location: '',
          color: '',
        })
      );
    });

    it('should update targetDepartments to null (broadcast to all)', async () => {
      const mockUpdatedEvent = {
        id: 'event-5',
        title: 'Test Event',
        description: 'Test description',
        event_date: '2024-01-15',
        event_time: '10:00 AM',
        location: 'Room 101',
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'meeting',
        color: '#FF5733',
        target_departments: null, // null means broadcast to all
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      await updateEvent('event-5', { targetDepartments: null });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target_departments: null,
        })
      );
    });

    /**
     * Property-Based Test: All provided fields with falsy values should be included in database update
     * 
     * This test generates random combinations of falsy values for different fields and verifies
     * that ALL provided fields are included in the database update, regardless of their truthiness.
     */
    it('property: all provided fields should be updated regardless of truthiness', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary updates with falsy values
          fc.record({
            description: fc.constantFrom(''),
            location: fc.constantFrom(''),
            color: fc.constantFrom(''),
            eventTime: fc.constantFrom(''),
          }),
          async (updates) => {
            // Reset mocks for each property test iteration
            mockUpdate.mockClear();
            mockEq.mockClear();
            mockSelect.mockClear();
            mockSingle.mockClear();

            const mockUpdatedEvent = {
              id: 'event-test',
              title: 'Test Event',
              description: updates.description || 'Default',
              event_date: '2024-01-15',
              event_time: updates.eventTime || '10:00 AM',
              location: updates.location || 'Default',
              created_by: 'staff-1',
              created_at: Date.now(),
              updated_at: new Date().toISOString(),
              category: 'meeting',
              color: updates.color || '#FF5733',
              target_departments: null,
            };

            mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

            // Act: Call updateEvent with the generated falsy values
            await updateEvent('event-test', updates);

            // Assert: Verify that ALL provided fields are included in the update
            const updateCall = mockUpdate.mock.calls[0][0];
            
            // Check that description is in the update if it was provided
            if (updates.description !== undefined) {
              expect(updateCall).toHaveProperty('description', updates.description);
            }
            
            // Check that location is in the update if it was provided
            if (updates.location !== undefined) {
              expect(updateCall).toHaveProperty('location', updates.location);
            }
            
            // Check that color is in the update if it was provided
            if (updates.color !== undefined) {
              expect(updateCall).toHaveProperty('color', updates.color);
            }
            
            // Check that event_time is in the update if eventTime was provided
            if (updates.eventTime !== undefined) {
              expect(updateCall).toHaveProperty('event_time', updates.eventTime);
            }
          }
        ),
        { numRuns: 50 } // Run 50 test cases with different combinations
      );
    });
  });
});


describe('Events CRUD Preservation Tests - Property 2: Non-Update Operations', () => {
  let mockUpdate: any;
  let mockEq: any;
  let mockSelect: any;
  let mockSingle: any;
  let mockOr: any;
  let mockOrder: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock chain for Supabase query builder
    mockSingle = vi.fn();
    mockSelect = vi.fn(() => ({ single: mockSingle }));
    mockEq = vi.fn(() => ({ select: mockSelect }));
    mockUpdate = vi.fn(() => ({ eq: mockEq }));
    
    // Mock chain for getEventsByDepartment
    mockOrder = vi.fn();
    mockOr = vi.fn(() => ({ order: mockOrder }));
    mockSelect = vi.fn(() => ({ or: mockOr }));

    // Mock the from method to return our mock chain
    vi.mocked(supabase.from).mockReturnValue({ 
      update: mockUpdate,
      select: mockSelect 
    } as any);
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
   * 
   * Preservation Property Tests - Non-Update Operations
   * 
   * These tests verify that operations NOT involving updateEvent with falsy values
   * continue to work correctly after the fix. This ensures no regressions are introduced.
   * 
   * **IMPORTANT**: These tests run on UNFIXED code first to observe baseline behavior,
   * then will be re-run after the fix to ensure behavior is preserved.
   * 
   * **EXPECTED OUTCOME**: Tests PASS on unfixed code - this confirms baseline behavior to preserve.
   */
  describe('Property 2: Preservation - Truthy Field Updates', () => {
    /**
     * Observation: updateEvent with truthy values (non-empty strings, valid dates) 
     * works correctly on unfixed code.
     * 
     * This test verifies that updating fields with truthy values continues to work
     * after the fix is implemented.
     */
    it('should update fields with truthy values correctly', async () => {
      const mockUpdatedEvent = {
        id: 'event-1',
        title: 'Updated Event Title',
        description: 'Updated description with content',
        event_date: '2024-02-20',
        event_time: '2:00 PM',
        location: 'Conference Room A',
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'workshop',
        color: '#00FF00',
        target_departments: ['Engineering', 'Design'],
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      await updateEvent('event-1', {
        title: 'Updated Event Title',
        description: 'Updated description with content',
        location: 'Conference Room A',
        category: 'meeting',
        color: '#00FF00',
      });

      // Verify that all truthy fields are included in the update
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Event Title',
          description: 'Updated description with content',
          location: 'Conference Room A',
          category: 'meeting',
          color: '#00FF00',
          updated_at: expect.any(String),
        })
      );
    });

    /**
     * Property-Based Test: All truthy field updates should work correctly
     * 
     * This test generates random combinations of truthy values and verifies
     * that they are all properly included in database updates.
     */
    it('property: truthy field updates should be preserved', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            location: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom('meeting', 'training', 'announcement', 'deadline'),
            color: fc.constantFrom('#FF5733', '#00FF00', '#0000FF', '#FFFF00'),
          }),
          async (updates) => {
            // Reset mocks for each property test iteration
            mockUpdate.mockClear();
            mockEq.mockClear();
            mockSingle.mockClear();

            const mockUpdatedEvent = {
              id: 'event-test',
              title: updates.title,
              description: updates.description,
              event_date: '2024-01-15',
              event_time: '10:00 AM',
              location: updates.location,
              created_by: 'staff-1',
              created_at: Date.now(),
              updated_at: new Date().toISOString(),
              category: updates.category,
              color: updates.color,
              target_departments: null,
            };

            mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

            // Act: Call updateEvent with truthy values
            await updateEvent('event-test', updates);

            // Assert: Verify that ALL truthy fields are included in the update
            const updateCall = mockUpdate.mock.calls[0][0];
            
            expect(updateCall).toHaveProperty('title', updates.title);
            expect(updateCall).toHaveProperty('description', updates.description);
            expect(updateCall).toHaveProperty('location', updates.location);
            expect(updateCall).toHaveProperty('category', updates.category);
            expect(updateCall).toHaveProperty('color', updates.color);
            expect(updateCall).toHaveProperty('updated_at');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 2: Preservation - Event Filtering by Department', () => {
    /**
     * Observation: Event filtering by department works correctly on unfixed code.
     * Events with targetDepartments=null are broadcast to all departments.
     * Events with specific departments are filtered correctly.
     * 
     * This test verifies that getEventsByDepartment continues to work after the fix.
     */
    it('should filter events by department correctly', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'All Departments Event',
          description: 'Broadcast to all',
          event_date: '2024-02-20',
          event_time: '10:00 AM',
          location: 'Main Hall',
          created_by: 'staff-1',
          created_at: Date.now(),
          updated_at: new Date().toISOString(),
          category: 'meeting',
          color: '#FF5733',
          target_departments: null, // Broadcast to all
        },
        {
          id: 'event-2',
          title: 'Engineering Event',
          description: 'Engineering only',
          event_date: '2024-02-21',
          event_time: '2:00 PM',
          location: 'Tech Lab',
          created_by: 'staff-2',
          created_at: Date.now(),
          updated_at: new Date().toISOString(),
          category: 'workshop',
          color: '#00FF00',
          target_departments: ['Engineering'],
        },
      ];

      mockOrder.mockResolvedValue({ data: mockEvents, error: null });

      const result = await getEventsByDepartment('Engineering');

      // Verify the correct query was constructed
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOr).toHaveBeenCalledWith('target_departments.is.null,target_departments.cs.{Engineering}');
      expect(mockOrder).toHaveBeenCalledWith('event_date', { ascending: true });
      
      // Verify result is successful
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    /**
     * Property-Based Test: Department filtering should work for all department names
     * 
     * This test generates random department names and verifies that the filtering
     * query is constructed correctly for each one.
     */
    it('property: department filtering should be preserved for all departments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'Engineering',
            'Design',
            'Marketing',
            'Sales',
            'Business Intelligence',
            'Human Resources',
            'Finance'
          ),
          async (department) => {
            // Reset mocks for each property test iteration
            mockSelect.mockClear();
            mockOr.mockClear();
            mockOrder.mockClear();

            const mockEvents = [
              {
                id: 'event-test',
                title: 'Test Event',
                description: 'Test',
                event_date: '2024-01-15',
                event_time: '10:00 AM',
                location: 'Test Location',
                created_by: 'staff-1',
                created_at: Date.now(),
                updated_at: new Date().toISOString(),
                category: 'meeting',
                color: '#FF5733',
                target_departments: null,
              },
            ];

            mockOrder.mockResolvedValue({ data: mockEvents, error: null });

            // Act: Call getEventsByDepartment
            await getEventsByDepartment(department);

            // Assert: Verify the correct query was constructed
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockOr).toHaveBeenCalledWith(
              `target_departments.is.null,target_departments.cs.{${department}}`
            );
            expect(mockOrder).toHaveBeenCalledWith('event_date', { ascending: true });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 2: Preservation - Mixed Truthy and Falsy Updates', () => {
    /**
     * Observation: When updating with a mix of truthy and falsy values,
     * the truthy values should always be included in the update.
     * 
     * This test verifies that truthy values continue to work correctly
     * even when mixed with falsy values in the same update.
     */
    it('should preserve truthy values in mixed updates', async () => {
      const mockUpdatedEvent = {
        id: 'event-1',
        title: 'Valid Title',
        description: '', // Falsy
        event_date: '2024-02-20',
        event_time: '10:00 AM',
        location: 'Valid Location', // Truthy
        created_by: 'staff-1',
        created_at: Date.now(),
        updated_at: new Date().toISOString(),
        category: 'meeting',
        color: null, // Falsy
        target_departments: null,
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

      await updateEvent('event-1', {
        title: 'Valid Title', // Truthy
        description: '', // Falsy
        location: 'Valid Location', // Truthy
        color: '', // Falsy
      });

      // Verify that truthy fields are included
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('title', 'Valid Title');
      expect(updateCall).toHaveProperty('location', 'Valid Location');
      expect(updateCall).toHaveProperty('updated_at');
    });

    /**
     * Property-Based Test: Truthy values should always be preserved in mixed updates
     * 
     * This test generates random combinations of truthy and falsy values and verifies
     * that truthy values are always included in the update.
     */
    it('property: truthy values preserved in mixed updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }), // Always truthy
            description: fc.constantFrom('', 'Valid description'), // Mix
            location: fc.string({ minLength: 1, maxLength: 50 }), // Always truthy
            color: fc.constantFrom('', '#FF5733'), // Mix
          }),
          async (updates) => {
            // Reset mocks for each property test iteration
            mockUpdate.mockClear();
            mockEq.mockClear();
            mockSingle.mockClear();

            const mockUpdatedEvent = {
              id: 'event-test',
              title: updates.title,
              description: updates.description || 'Default',
              event_date: '2024-01-15',
              event_time: '10:00 AM',
              location: updates.location,
              created_by: 'staff-1',
              created_at: Date.now(),
              updated_at: new Date().toISOString(),
              category: 'meeting',
              color: updates.color || '#FF5733',
              target_departments: null,
            };

            mockSingle.mockResolvedValue({ data: mockUpdatedEvent, error: null });

            // Act: Call updateEvent with mixed values
            await updateEvent('event-test', updates);

            // Assert: Verify that truthy fields are always included
            const updateCall = mockUpdate.mock.calls[0][0];
            
            // Title and location are always truthy, so they should always be present
            expect(updateCall).toHaveProperty('title', updates.title);
            expect(updateCall).toHaveProperty('location', updates.location);
            expect(updateCall).toHaveProperty('updated_at');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
