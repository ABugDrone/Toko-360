'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-context';
import { getEventsByDepartment, addEvent, updateEvent, deleteEvent, getDepartments } from '@/lib/storage';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, X, Save, Loader2, Users, RefreshCw } from 'lucide-react';
import type { Event, DepartmentRecord } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useRealtimeEvents } from '@/hooks/use-realtime-events';
import { ConnectionStatus } from '@/components/ui/connection-status';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    category: 'other' as 'meeting' | 'training' | 'announcement' | 'deadline' | 'webinar' | 'bootcamp' | 'tedx' | 'other',
    color: 'bg-blue-600',
    targetDepartments: null as string[] | null,
  });

  const isBusinessIntelligence = user?.department === 'Business Intelligence';

  // Handle real-time event updates
  const handleEventCreated = useCallback((newEvent: Event) => {
    setEvents(prev => {
      // Check if event already exists to avoid duplicates
      if (prev.some(e => e.id === newEvent.id)) {
        return prev;
      }
      return [...prev, newEvent].sort((a, b) => 
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
    });
  }, []);

  const handleEventUpdated = useCallback((updatedEvent: Event) => {
    setEvents(prev => 
      prev.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    );
  }, []);

  const handleEventDeleted = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  // Set up real-time subscription
  const connectionStatus = useRealtimeEvents({
    department: user?.department,
    onEventCreated: handleEventCreated,
    onEventUpdated: handleEventUpdated,
    onEventDeleted: handleEventDeleted,
  });

  // Load events and departments on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsData, departmentsData] = await Promise.all([
          user?.department ? getEventsByDepartment(user.department) : [],
          getDepartments()
        ]);
        setEvents(eventsData);
        setDepartments(departmentsData.filter(d => d.status === 'active'));
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up periodic refresh every 30 seconds to catch any missed real-time updates
    const refreshInterval = setInterval(() => {
      if (user?.department && !showForm) {
        getEventsByDepartment(user.department).then(updatedEvents => {
          setEvents(updatedEvents);
        }).catch(error => {
          console.error('Failed to refresh events:', error);
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user?.department, showForm]);

  const handleNewEvent = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      location: '',
      category: 'other',
      color: 'bg-blue-600',
      targetDepartments: null,
    });
    setShowForm(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      location: event.location,
      category: event.category || 'other',
      color: event.color || 'bg-blue-600',
      targetDepartments: event.targetDepartments || null,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staffId) return;
    
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        // Update event
        await updateEvent(editingId, {
          ...formData,
          updatedAt: Date.now(),
        });
        showSuccessToast('Event updated successfully');
      } else {
        // Create event
        await addEvent({
          ...formData,
          createdBy: user.staffId,
        });
        showSuccessToast('Event created successfully');
      }
      
      // Close form and reset after successful save
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        eventTime: '',
        location: '',
        category: 'other',
        color: 'bg-blue-600',
        targetDepartments: null,
      });
      
      // Reload events
      if (user?.department) {
        const updatedEvents = await getEventsByDepartment(user.department);
        setEvents(updatedEvents);
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteEvent(eventId);
      showSuccessToast('Event deleted successfully');
      
      // Reload events after successful delete
      if (user?.department) {
        const updatedEvents = await getEventsByDepartment(user.department);
        setEvents(updatedEvents);
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      location: '',
      category: 'other',
      color: 'bg-blue-600',
      targetDepartments: null,
    });
  };

  const handleRefresh = async () => {
    if (!user?.department) return;
    setLoading(true);
    try {
      const updatedEvents = await getEventsByDepartment(user.department);
      setEvents(updatedEvents);
      showSuccessToast('Events refreshed');
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentToggle = (deptName: string) => {
    setFormData(prev => {
      // If targetDepartments is null, initialize with all departments except the one being toggled
      if (prev.targetDepartments === null) {
        return {
          ...prev,
          targetDepartments: departments
            .map(d => d.name)
            .filter(name => name !== deptName)
        };
      }
      
      // If department is in the list, remove it
      if (prev.targetDepartments.includes(deptName)) {
        const updated = prev.targetDepartments.filter(d => d !== deptName);
        // If all departments are selected, set to null (broadcast to all)
        return {
          ...prev,
          targetDepartments: updated.length === 0 ? null : updated
        };
      }
      
      // Add department to the list
      const updated = [...prev.targetDepartments, deptName];
      // If all departments are now selected, set to null (broadcast to all)
      return {
        ...prev,
        targetDepartments: updated.length === departments.length ? null : updated
      };
    });
  };

  const handleBroadcastToAll = () => {
    setFormData(prev => ({
      ...prev,
      targetDepartments: null
    }));
  };

  const categoryColors = {
    meeting: 'bg-blue-600',
    training: 'bg-purple-600',
    announcement: 'bg-cyan-600',
    deadline: 'bg-red-600',
    webinar: 'bg-green-600',
    bootcamp: 'bg-orange-600',
    tedx: 'bg-pink-600',
    other: 'bg-gray-600',
  };

  return (
    <>
      <TopNav title="Events" />
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
              Upcoming Events
            </h2>
            <div className="flex items-center gap-3">
              <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                Stay updated with important dates and announcements
              </p>
              {/* Connection Status Indicator */}
              <ConnectionStatus
                status={
                  connectionStatus.isConnected
                    ? 'online'
                    : connectionStatus.isReconnecting
                    ? 'reconnecting'
                    : 'offline'
                }
                showLabel={false}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="font-bold px-4 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--theme-surface)', borderWidth: '1px', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              title="Refresh events"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {isBusinessIntelligence && !showForm && (
              <Button
                onClick={handleNewEvent}
                className="font-bold px-6 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            )}
          </div>
        </div>

        {/* Event Form */}
        {showForm && isBusinessIntelligence && (
          <div className="rounded-xl p-8 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                {editingId ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button onClick={handleCancel} className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                  Event Title
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Team Meeting, Training Session"
                  required
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event details..."
                  required
                  className="w-full px-4 py-3 rounded-lg min-h-32 transition-colors duration-300 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderWidth: '1px',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--theme-background)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                    Time
                  </label>
                  <Input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    required
                    className="transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--theme-background)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                    Location
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Room 602"
                    required
                    className="transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--theme-background)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderWidth: '1px',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <option value="meeting">Meeting</option>
                  <option value="training">Training</option>
                  <option value="announcement">Announcement</option>
                  <option value="deadline">Deadline</option>
                  <option value="webinar">Webinar</option>
                  <option value="bootcamp">Bootcamp</option>
                  <option value="tedx">TedX</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Target Departments */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                  Target Departments
                </label>
                <div className="space-y-3">
                  {/* Broadcast to All Button */}
                  <button
                    type="button"
                    onClick={handleBroadcastToAll}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 flex items-center justify-between ${
                      formData.targetDepartments === null
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    style={{
                      backgroundColor: formData.targetDepartments === null ? 'rgba(34, 197, 94, 0.1)' : 'var(--theme-background)',
                      borderColor: formData.targetDepartments === null ? '#22c55e' : 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" style={{ color: formData.targetDepartments === null ? '#22c55e' : 'var(--theme-text)' }} />
                      <span className="font-semibold transition-colors duration-300" style={{ color: formData.targetDepartments === null ? '#22c55e' : 'var(--theme-text)' }}>
                        Broadcast to All Departments
                      </span>
                    </div>
                    {formData.targetDepartments === null && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500 text-white font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>

                  {/* Individual Department Selection */}
                  <div className="border rounded-lg p-4 transition-colors duration-300" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-background)' }}>
                    <p className="text-xs mb-3 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                      Or select specific departments:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {departments.map((dept) => {
                        const isSelected = formData.targetDepartments === null || formData.targetDepartments.includes(dept.name);
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => handleDepartmentToggle(dept.name)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-500'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'var(--theme-surface)',
                              borderWidth: '1px',
                              borderColor: isSelected ? '#06b6d4' : 'var(--theme-border)',
                              color: isSelected ? '#06b6d4' : 'var(--theme-text)',
                            }}
                          >
                            {dept.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      SAVE EVENT
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 font-bold rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--theme-surface)', borderWidth: '1px', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        {!showForm && (
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl p-12 text-center border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl p-12 text-center border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--theme-text)', opacity: 0.3 }} />
                <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                  No upcoming events. {isBusinessIntelligence && 'Create your first event.'}
                </p>
                {isBusinessIntelligence && (
                  <Button
                    onClick={handleNewEvent}
                    className="mt-4 font-bold rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
                  >
                    Create Event
                  </Button>
                )}
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl p-6 border transition-all duration-300 hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg ${categoryColors[event.category || 'other']} flex items-center justify-center flex-shrink-0`}>
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                          {event.title}
                        </h3>
                        <p className="mb-3 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                            <span className="transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                              {new Date(event.eventDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                            <span className="transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                              {event.eventTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                            <span className="transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                              {event.location}
                            </span>
                          </div>
                          {isBusinessIntelligence && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                              <span className="transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                                {event.targetDepartments === null || event.targetDepartments.length === 0
                                  ? 'All Departments'
                                  : `${event.targetDepartments.length} Department${event.targetDepartments.length > 1 ? 's' : ''}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {isBusinessIntelligence && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEditEvent(event)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: 'var(--theme-background)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}
                        >
                          <Edit className="w-4 h-4" style={{ color: 'var(--theme-text)' }} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ backgroundColor: 'var(--theme-background)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
