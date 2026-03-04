'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-context';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '@/lib/storage';
import { DepartmentRecord } from '@/lib/types';
import { AlertCircle, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';

export default function DepartmentManagementPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', head: '', status: 'active' as 'active' | 'inactive' });

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const fetchedDepartments = await getDepartments();
        setDepartments(fetchedDepartments);
      } catch (error) {
        console.error('Failed to load departments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDepartments();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Access Denied</p>
        </div>
      </div>
    );
  }

  const handleAddDepartment = async () => {
    if (!formData.name.trim() || !formData.head.trim()) {
      showErrorToast({ message: 'Please fill in all fields', retryable: false });
      return;
    }

    setIsSubmitting(true);
    
    // Optimistic UI update - close form immediately
    const formDataCopy = { ...formData };
    setFormData({ name: '', head: '', status: 'active' });
    setShowForm(false);
    
    try {
      await addDepartment({
        name: formDataCopy.name,
        head: formDataCopy.head,
        status: formDataCopy.status,
      });
      showSuccessToast('Department created successfully');
      
      // Reload departments in background
      getDepartments().then(updatedDepartments => {
        setDepartments(updatedDepartments);
      });
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleAddDepartment(),
      });
      // Reload departments on error
      getDepartments().then(updatedDepartments => {
        setDepartments(updatedDepartments);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingId || !formData.name.trim() || !formData.head.trim()) {
      showErrorToast({ message: 'Please fill in all fields', retryable: false });
      return;
    }

    setIsSubmitting(true);
    
    // Optimistic UI update - close form immediately
    const formDataCopy = { ...formData };
    const editingIdCopy = editingId;
    setFormData({ name: '', head: '', status: 'active' });
    setEditingId(null);
    
    try {
      await updateDepartment(editingIdCopy, {
        name: formDataCopy.name,
        head: formDataCopy.head,
        status: formDataCopy.status,
      });
      showSuccessToast('Department updated successfully');
      
      // Reload departments in background
      getDepartments().then(updatedDepartments => {
        setDepartments(updatedDepartments);
      });
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleUpdateDepartment(),
      });
      // Reload departments on error
      getDepartments().then(updatedDepartments => {
        setDepartments(updatedDepartments);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This will set it to inactive.')) return;
    
    setIsSubmitting(true);
    
    // Optimistic UI update - mark as inactive immediately
    const previousDepartments = [...departments];
    setDepartments(departments.map(d => d.id === id ? { ...d, status: 'inactive' as const } : d));
    
    try {
      await deleteDepartment(id);
      showSuccessToast('Department deleted successfully');
      
      // Reload departments in background
      getDepartments().then(updatedDepartments => {
        setDepartments(updatedDepartments);
      });
    } catch (error: any) {
      // Revert on error
      setDepartments(previousDepartments);
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleDeleteDepartment(id),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (dept: DepartmentRecord) => {
    setFormData({ name: dept.name, head: dept.head, status: dept.status });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', head: '', status: 'active' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <>
      <TopNav title="Department Management" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Department Management</h2>
            <p className="text-slate-400">Create, edit, and manage departments and their heads</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Department
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="neon-border-green bg-slate-900/60 rounded-xl p-6 backdrop-blur space-y-4">
            <h3 className="text-lg font-bold text-green-400 uppercase tracking-wider">
              {editingId ? 'Edit Department' : 'Create New Department'}
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-2 text-sm">Department Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Business Intelligence"
                className="bg-slate-800/60 border-green-500/30 text-white placeholder-slate-500 focus:border-green-500/60 focus:shadow-[0_0_10px_rgba(0,255,136,0.3)]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2 text-sm">Department Head</label>
              <Input
                type="text"
                value={formData.head}
                onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                placeholder="e.g., Elena Kovic"
                className="bg-slate-800/60 border-green-500/30 text-white placeholder-slate-500 focus:border-green-500/60 focus:shadow-[0_0_10px_rgba(0,255,136,0.3)]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2 text-sm">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full bg-slate-800/60 border border-green-500/30 text-white rounded px-3 py-2 focus:border-green-500/60 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={editingId ? handleUpdateDepartment : handleAddDepartment}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingId ? 'Update Department' : 'Create Department'
                )}
              </Button>
              <Button
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg disabled:opacity-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Departments Table */}
        <div className="neon-border-cyan bg-slate-900/60 rounded-xl p-6 backdrop-blur overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Loading departments...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No departments yet. Create your first department.</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg"
              >
                Create Department
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Department</th>
                  <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Head</th>
                  <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Created</th>
                  <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{dept.name}</td>
                    <td className="py-3 px-4 text-slate-300">{dept.head}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold border ${
                          dept.status === 'active'
                            ? 'text-green-400 bg-green-500/10 border-green-500/30'
                            : 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                        }`}
                      >
                        {dept.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => startEdit(dept)}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-cyan-400 transition-colors p-1 hover:bg-slate-800/50 rounded disabled:opacity-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1 hover:bg-slate-800/50 rounded disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
