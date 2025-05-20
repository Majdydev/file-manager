import React, { useEffect, useState } from 'react';
import { getDb } from '../db';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import DataTable from '../components/DataTable';
import { Passion } from '../types';
import { Plus, Trash2, Edit, User } from 'lucide-react';

const PassionsPage: React.FC = () => {
  const [passions, setPassions] = useState<Passion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Passion | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const db = getDb();
      const allPassions = await db.query('SELECT * FROM passions ORDER BY name');
      setPassions(allPassions);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    }
  };
  
  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setEditing(null);
    setShowForm(false);
  };
  
  const handleEditPassion = (passion: Passion) => {
    setEditing(passion);
    setName(passion.name);
    setPhone(passion.phone || '');
    setEmail(passion.email || '');
    setAddress(passion.address || '');
    setNotes(passion.notes || '');
    setShowForm(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Name is required');
      return;
    }
    
    try {
      const db = getDb();
      
      if (editing) {
        await db.execute(`
          UPDATE passions
          SET name = ?, phone = ?, email = ?, address = ?, notes = ?
          WHERE id = ?
        `, [
          name,
          phone,
          email,
          address,
          notes,
          editing.id
        ]);
      } else {
        await db.execute(`
          INSERT INTO passions (name, phone, email, address, notes)
          VALUES (?, ?, ?, ?, ?)
        `, [
          name,
          phone,
          email,
          address,
          notes
        ]);
      }
      
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving passion:', error);
      setError('Failed to save passion');
    }
  };
  
  const handleDeletePassion = async (passion: Passion) => {
    if (!confirm(`Are you sure you want to delete "${passion.name}"?`)) {
      return;
    }
    
    try {
      const db = getDb();
      
      // Check if there are any related records
      const rendezvousCount = await db.get('SELECT COUNT(*) as count FROM rendezvous WHERE passion_id = ?', [passion.id]);
      const visitsCount = await db.get('SELECT COUNT(*) as count FROM visits WHERE passion_id = ?', [passion.id]);
      
      if (rendezvousCount.count > 0 || visitsCount.count > 0) {
        const message = `Cannot delete: This passion has ${rendezvousCount.count} rendezvous and ${visitsCount.count} visits associated with it.`;
        setError(message);
        return;
      }
      
      // Delete the passion
      await db.execute('DELETE FROM passions WHERE id = ?', [passion.id]);
      await loadData();
    } catch (error) {
      console.error('Error deleting passion:', error);
      setError('Failed to delete passion');
    }
  };
  
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (passion: Passion) => (
        <div className="flex items-center">
          <User size={18} className="mr-2 text-gray-500" />
          <span className="font-medium">{passion.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'register_date',
      header: 'Date Added',
      render: (passion: Passion) => new Date(passion.register_date).toLocaleDateString(),
      sortable: true,
    },
  ];
  
  const passionActions = (passion: Passion) => (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        size="sm"
        className="p-1"
        onClick={() => handleEditPassion(passion)}
        aria-label="Edit passion"
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeletePassion(passion)}
        aria-label="Delete passion"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Passions</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'Add Passion'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button className="float-right" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {showForm && (
        <Card className="mb-6" title={editing ? 'Edit Passion' : 'Add New Passion'}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Input
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                
                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editing ? 'Update Passion' : 'Save Passion'}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      <Card>
        {passions.length > 0 ? (
          <DataTable
            columns={columns}
            data={passions}
            keyExtractor={(passion) => passion.id.toString()}
            actions={passionActions}
          />
        ) : (
          <div className="text-center py-8">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No passions yet</h3>
            <p className="text-gray-400 mb-4">Add your first passion to get started</p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Add Passion
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PassionsPage;