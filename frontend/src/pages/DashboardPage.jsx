import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const tenantData = localStorage.getItem('tenant');

    if (!token || !userData || !tenantData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setTenant(JSON.parse(tenantData));
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantSlug = localStorage.getItem('tenantSlug');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantSlug
        }
      });

      setNotes(response.data.notes);
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const tenantSlug = localStorage.getItem('tenantSlug');

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/notes`, newNote, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantSlug
        }
      });

      setNotes([response.data.note, ...notes]);
      setNewNote({ title: '', content: '' });
      toast.success('Note created successfully!');
    } catch (error) {
      if (error.response?.data?.upgradeRequired) {
        toast.error('Note limit reached! Upgrade to Pro for unlimited notes.');
      } else {
        toast.error('Failed to create note');
      }
    }
  };

  const updateNote = async (id, updatedNote) => {
    try {
      const token = localStorage.getItem('token');
      const tenantSlug = localStorage.getItem('tenantSlug');

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/notes/${id}`, updatedNote, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantSlug
        }
      });

      setNotes(notes.map(note => note._id === id ? response.data.note : note));
      setEditingNote(null);
      toast.success('Note updated successfully!');
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      const tenantSlug = localStorage.getItem('tenantSlug');

      await axios.delete(`${import.meta.env.VITE_API_URL}/notes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantSlug
        }
      });

      setNotes(notes.filter(note => note._id !== id));
      toast.success('Note deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const upgradeTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantSlug = localStorage.getItem('tenantSlug');

      await axios.post(`${import.meta.env.VITE_API_URL}/tenants/upgrade`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantSlug
        }
      });

      toast.success('Upgraded to Pro plan!');
      setTenant({ ...tenant, plan: 'pro' });
      localStorage.setItem('tenant', JSON.stringify({ ...tenant, plan: 'pro' }));
    } catch (error) {
      toast.error('Upgrade failed');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tenant?.name} - Notes
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.email} ({user?.role}) | Plan: {tenant?.plan}
              </p>
            </div>
            <div className="flex space-x-4">
              {tenant?.plan === 'free' && user?.role === 'admin' && (
                <button
                  onClick={upgradeTenant}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Upgrade to Pro
                </button>
              )}
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Create New Note
              </h3>
              <form onSubmit={createNote} className="space-y-4">
                <input
                  type="text"
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <textarea
                  placeholder="Note content..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Note
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div key={note._id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  {editingNote === note._id ? (
                    <EditNoteForm 
                      note={note} 
                      onSave={(updatedNote) => updateNote(note._id, updatedNote)}
                      onCancel={() => setEditingNote(null)}
                    />
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {note.title}
                      </h3>
                      <p className="text-gray-700 mb-4">{note.content}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <div className="space-x-2">
                          <button
                            onClick={() => setEditingNote(note._id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteNote(note._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No notes yet. Create your first note above!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const EditNoteForm = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DashboardPage;

