import { motion } from 'framer-motion';
import { Users, Phone, Mail, Building2 } from 'lucide-react';

type Lead = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'New' | 'Contacted' | 'Site Visit' | 'Closed';
  assignedTo?: string;
  propertyId?: string;
};

interface KanbanBoardProps {
  leads: Lead[];
  onMove: (id: string, status: Lead['status']) => void;
}

const columns = [
  { key: 'New', label: 'New', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { key: 'Contacted', label: 'Contacted', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { key: 'Site Visit', label: 'Site Visit', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { key: 'Closed', label: 'Closed', color: 'bg-green-100', textColor: 'text-green-800' },
] as const;

export default function KanbanBoard({ leads, onMove }: KanbanBoardProps) {
  const getLeadsByStatus = (status: Lead['status']) => {
    return leads.filter(lead => lead.status === status);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div key={column.key} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-lg ${column.textColor}`}>
              {column.label}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${column.color} ${column.textColor}`}>
              {getLeadsByStatus(column.key).length}
            </span>
          </div>
          
          <div className="space-y-3">
            {getLeadsByStatus(column.key).map((lead) => (
              <motion.div
                key={lead._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  // Move to next status
                  const currentIndex = columns.findIndex(col => col.key === lead.status);
                  const nextStatus = columns[(currentIndex + 1) % columns.length].key;
                  onMove(lead._id, nextStatus);
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">{lead.name}</h4>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  {lead.email && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Mail className="w-3 h-3" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  
                  {lead.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  
                  {lead.propertyId && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Building2 className="w-3 h-3" />
                      <span>Property ID: {lead.propertyId}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Click to move to next stage
                  </p>
                </div>
              </motion.div>
            ))}
            
            {getLeadsByStatus(column.key).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No leads</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

