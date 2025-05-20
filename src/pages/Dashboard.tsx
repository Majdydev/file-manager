import React, { useEffect, useState } from 'react';
import { getDb } from '../db';
import Card from '../components/Card';
import Button from '../components/Button';
import { FileText, Users, Calendar, ClipboardCheck, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Passion, Rendezvous, Visit } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    files: 0,
    passions: 0,
    upcomingRendezvous: 0,
    visits: 0,
  });
  
  const [recentPassions, setRecentPassions] = useState<Passion[]>([]);
  const [upcomingRendezvous, setUpcomingRendezvous] = useState<Rendezvous[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const db = getDb();
        
        // Get counts using the new async API
        const fileCount = await db.get('SELECT COUNT(*) as count FROM files');
        const passionCount = await db.get('SELECT COUNT(*) as count FROM passions');
        const rendezvousCount = await db.get("SELECT COUNT(*) as count FROM rendezvous WHERE date >= DATE('now') AND status = 'pending'");
        const visitCount = await db.get('SELECT COUNT(*) as count FROM visits');
        
        setStats({
          files: fileCount.count,
          passions: passionCount.count,
          upcomingRendezvous: rendezvousCount.count,
          visits: visitCount.count,
        });
        
        // Get recent records using the new async API
        const passions = await db.query('SELECT * FROM passions ORDER BY register_date DESC LIMIT 5');
        setRecentPassions(passions);
        
        const rendezvous = await db.query(`
          SELECT r.*, p.name as passion_name 
          FROM rendezvous r
          JOIN passions p ON r.passion_id = p.id
          WHERE r.date >= DATE('now') AND r.status = 'pending'
          ORDER BY r.date ASC
          LIMIT 5
        `);
        setUpcomingRendezvous(rendezvous);
        
        const visits = await db.query(`
          SELECT v.*, p.name as passion_name 
          FROM visits v
          JOIN passions p ON v.passion_id = p.id
          ORDER BY v.date DESC
          LIMIT 5
        `);
        setRecentVisits(visits);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <FileText className="text-[#0A2463]" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Files</p>
            <h3 className="text-xl font-semibold">{stats.files}</h3>
          </div>
        </Card>
        
        <Card className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <Users className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Passions</p>
            <h3 className="text-xl font-semibold">{stats.passions}</h3>
          </div>
        </Card>
        
        <Card className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 mr-4">
            <Calendar className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Rendezvous</p>
            <h3 className="text-xl font-semibold">{stats.upcomingRendezvous}</h3>
          </div>
        </Card>
        
        <Card className="flex items-center">
          <div className="p-3 rounded-full bg-amber-100 mr-4">
            <ClipboardCheck className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Visits</p>
            <h3 className="text-xl font-semibold">{stats.visits}</h3>
          </div>
        </Card>
      </div>
      
      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Recent Passions">
          {recentPassions.length > 0 ? (
            <div className="space-y-4">
              {recentPassions.map((passion) => (
                <div key={passion.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h4 className="font-medium">{passion.name}</h4>
                    <p className="text-sm text-gray-500">{passion.email || 'No email'}</p>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(passion.register_date)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No passions added yet</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button 
              variant="primary" 
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/passions')}
            >
              View All
            </Button>
          </div>
        </Card>
        
        <Card title="Upcoming Rendezvous">
          {upcomingRendezvous.length > 0 ? (
            <div className="space-y-4">
              {upcomingRendezvous.map((rendez) => (
                <div key={rendez.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h4 className="font-medium">{rendez.passion_name}</h4>
                    <p className="text-sm text-gray-500">{rendez.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(rendez.date)}</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {rendez.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming rendezvous</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button 
              variant="primary" 
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/rendezvous')}
            >
              View All
            </Button>
          </div>
        </Card>
        
        <Card title="Recent Visits">
          {recentVisits.length > 0 ? (
            <div className="space-y-4">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h4 className="font-medium">{visit.passion_name}</h4>
                    <p className="text-sm text-gray-500">{visit.notes.length > 50 ? visit.notes.substring(0, 50) + '...' : visit.notes}</p>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(visit.date)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No visits recorded yet</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button 
              variant="primary" 
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/visits')}
            >
              View All
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;