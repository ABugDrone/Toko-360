'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-context';
import { getAllUsers, updateUser, addUser, deleteUser, getDepartments } from '@/lib/storage';
import { User, Department, UserRole, DepartmentRecord } from '@/lib/types';
import { Zap, Users as UsersIcon, Plus, Edit2, AlertCircle, CheckCircle, Trash2, X, Loader2 } from 'lucide-react';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';

export default function AdminConfigPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [userFormData, setUserFormData] = useState({
    staffId: '',
    name: '',
    email: '',
    department: '' as string,
    role: 'staff' as UserRole,
  });
  const [generalSettings, setGeneralSettings] = useState({
    lateArrivalThreshold: 15,
    darkModeForced: true,
    systemNotifications: true,
  });
  const [saveMessage, setSaveMessage] = useState('');

  // Load users and departments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedUsers, fetchedDepartments] = await Promise.all([
          getAllUsers(),
          getDepartments()
        ]);
        setUsers(fetchedUsers);
        setDepartments(fetchedDepartments.filter(d => d.status === 'active'));
        
        // Set default department if available
        if (fetchedDepartments.length > 0 && !userFormData.department) {
          setUserFormData(prev => ({ ...prev, department: fetchedDepartments[0].name }));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Access Denied</p>
          <p className="text-slate-400">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSaveSettings = () => {
    setSaveMessage('Settings saved successfully');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddUser = async () => {
    if (!userFormData.staffId || !userFormData.name || !userFormData.email) {
      showErrorToast({ message: 'Please fill in all required fields', retryable: false });
      return;
    }

    setIsSubmitting(true);
    
    // Optimistic UI update - close form immediately
    const newUser: User = {
      id: `user-${Date.now()}`,
      staffId: userFormData.staffId,
      name: userFormData.name,
      email: userFormData.email,
      department: userFormData.department as Department,
      role: userFormData.role,
      status: 'online',
    };
    
    resetUserForm();

    try {
      await addUser(newUser);
      showSuccessToast('User added successfully');
      
      // Reload users in background
      getAllUsers().then(updatedUsers => {
        setUsers(updatedUsers);
      });
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleAddUser(),
      });
      // Reload users on error
      getAllUsers().then(updatedUsers => {
        setUsers(updatedUsers);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUserId || !userFormData.staffId || !userFormData.name || !userFormData.email) {
      showErrorToast({ message: 'Please fill in all required fields', retryable: false });
      return;
    }

    setIsSubmitting(true);
    
    // Optimistic UI update - close form immediately
    const editingUserIdCopy = editingUserId;
    const userFormDataCopy = { ...userFormData };
    resetUserForm();
    
    try {
      await updateUser(editingUserIdCopy, {
        name: userFormDataCopy.name,
        email: userFormDataCopy.email,
        department: userFormDataCopy.department as Department,
        role: userFormDataCopy.role,
      });
      showSuccessToast('User updated successfully');
      
      // Reload users in background
      getAllUsers().then(updatedUsers => {
        setUsers(updatedUsers);
      });
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleUpdateUser(),
      });
      // Reload users on error
      getAllUsers().then(updatedUsers => {
        setUsers(updatedUsers);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setIsSubmitting(true);
    
    // Optimistic UI update - remove user immediately
    const previousUsers = [...users];
    setUsers(users.filter(u => u.id !== userId));
    
    try {
      await deleteUser(userId);
      showSuccessToast('User deleted successfully');
    } catch (error: any) {
      // Revert on error
      setUsers(previousUsers);
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleDeleteUser(userId),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditUser = (u: User) => {
    setUserFormData({
      staffId: u.staffId,
      name: u.name,
      email: u.email,
      department: u.department,
      role: u.role,
    });
    setEditingUserId(u.id);
    setShowUserForm(true);
  };

  const resetUserForm = () => {
    const defaultDept = departments.length > 0 ? departments[0].name : '';
    setUserFormData({
      staffId: '',
      name: '',
      email: '',
      department: defaultDept,
      role: 'staff',
    });
    setEditingUserId(null);
    setShowUserForm(false);
  };

  const activeUsers = users.filter((u) => u.role !== 'admin');
  const departmentHeads = users.filter((u) => u.role === 'department_head');

  return (
    <>
      <TopNav title="System Configuration" />
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Master Control Deck</h2>
          <p className="text-slate-400">Centralized governance for the Toko Academy environment. Adjust global triggers, manage access protocols, and calibrate attendance logic.</p>
        </div>

        {/* General Settings */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">General Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Late Arrival Threshold (minutes)</label>
              <Input
                type="number"
                value={generalSettings.lateArrivalThreshold}
                onChange={(e) => setGeneralSettings({ ...generalSettings, lateArrivalThreshold: parseInt(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white max-w-xs"
              />
              <p className="text-xs text-slate-400 mt-1">Tolerance before flagging as 'late'</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="font-semibold text-white mb-1">System-wide Notifications</p>
                <p className="text-xs text-slate-400">Broadcast administrative alerts to all terminal dashboards</p>
              </div>
              <button
                onClick={() => setGeneralSettings({ ...generalSettings, systemNotifications: !generalSettings.systemNotifications })}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  generalSettings.systemNotifications ? 'bg-cyan-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    generalSettings.systemNotifications ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="font-semibold text-white mb-1">Dark Mode Force-Sync</p>
                <p className="text-xs text-slate-400">Enforce dark aesthetic across all academy interfaces</p>
              </div>
              <button
                onClick={() => setGeneralSettings({ ...generalSettings, darkModeForced: !generalSettings.darkModeForced })}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  generalSettings.darkModeForced ? 'bg-green-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    generalSettings.darkModeForced ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 bg-green-950 border border-green-800 rounded-lg text-green-200 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {saveMessage}
            </div>
          )}

          <Button
            onClick={handleSaveSettings}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg transition-colors py-2"
          >
            SAVE CONFIGURATION
          </Button>
        </div>

        {/* Check-in Rules */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-8 backdrop-blur space-y-4">
          <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wider">Check-in Rules</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-white mb-1"><span className="font-bold">Late Arrival Threshold:</span> {generalSettings.lateArrivalThreshold} minutes</p>
              <p className="text-xs text-slate-400">Tolerance before flagging as 'Late'</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-white mb-1"><span className="font-bold">Attendance Method:</span> IN-APP CHECK-IN</p>
              <p className="text-xs text-slate-400">Simple button-based check-in from dashboard</p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center justify-between pb-4 border-b transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center gap-3">
              <UsersIcon className="w-5 h-5 transition-colors duration-300" style={{ color: 'var(--theme-accent)' }} />
              <h3 className="text-lg font-bold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>User Management</h3>
            </div>
            <Button 
              onClick={() => setShowUserForm(!showUserForm)}
              className="font-bold px-4 rounded-lg text-sm transition-all duration-300"
              style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add New User
            </Button>
          </div>

          {/* Add/Edit User Form */}
          {showUserForm && (
            <div className="mt-6 p-6 rounded-lg border-2 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-accent)' }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                  {editingUserId ? 'Edit User' : 'Add New User'}
                </h4>
                <button onClick={resetUserForm} className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Staff ID</label>
                  <Input
                    value={userFormData.staffId}
                    onChange={(e) => setUserFormData({ ...userFormData, staffId: e.target.value })}
                    placeholder="e.g., AR001"
                    className="transition-colors duration-300"
                    style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Full Name</label>
                  <Input
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="e.g., Alex Rivera"
                    className="transition-colors duration-300"
                    style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Email</label>
                  <Input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="e.g., a.rivera@toko.edu"
                    className="transition-colors duration-300"
                    style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Department</label>
                  <select
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border transition-colors duration-300"
                    style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  >
                    {departments.length === 0 ? (
                      <option value="">No departments available - Create one first</option>
                    ) : (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))
                    )}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                      Please create a department first in Department Management
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg border transition-colors duration-300"
                    style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  >
                    <option value="staff">Staff</option>
                    <option value="instructor">Instructor</option>
                    <option value="senior_instructor">Senior Instructor</option>
                    <option value="department_head">Department Head</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={editingUserId ? handleUpdateUser : handleAddUser}
                  disabled={isSubmitting}
                  className="flex-1 font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      {editingUserId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingUserId ? 'Update User' : 'Add User'
                  )}
                </Button>
                <Button
                  onClick={resetUserForm}
                  disabled={isSubmitting}
                  className="flex-1 font-bold rounded-lg transition-all duration-300 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Identity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b transition-colors duration-300 hover:opacity-80" style={{ borderColor: 'var(--theme-border)' }}>
                    <td className="px-4 py-3 text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                      <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: 'var(--theme-accent)' }}>
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{u.name}</td>
                    <td className="px-4 py-3 text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.8 }}>{u.department}</td>
                    <td className="px-4 py-3 text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.8 }}>{u.role.replace('_', ' ').toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', borderWidth: '1px', borderColor: 'rgba(34, 197, 94, 0.5)' }}>
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button 
                        onClick={() => startEditUser(u)}
                        className="transition-all duration-300 hover:scale-110" 
                        style={{ color: 'var(--theme-text)', opacity: 0.6 }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="transition-all duration-300 hover:scale-110 hover:text-red-500" 
                        style={{ color: 'var(--theme-text)', opacity: 0.6 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center pt-4 border-t transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>Showing {users.length} total users</p>
          </div>
        </div>
      </div>
    </>
  );
}
