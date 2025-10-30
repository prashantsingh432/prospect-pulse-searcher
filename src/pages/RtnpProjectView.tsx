import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, User, MapPin, Briefcase, Building, Mail, Phone, PhoneCall, CheckCircle, Star, Share } from "lucide-react";

interface RtneRequest {
  id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  linkedin_url: string;
  full_name?: string;
  city?: string;
  job_title?: string;
  company_name?: string;
  email_address?: string;
  primary_phone?: string;
  phone_2?: string;
  phone_3?: string;
  phone_4?: string;
  status: string;
  row_number: number;
  created_at: string;
}

export const RtnpProjectView: React.FC = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RtneRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});

  const isRtnpUser = user?.email === 'realtimenumberprovider@amplior.com' || isAdmin();

  useEffect(() => {
    if (!isRtnpUser || !projectName) {
      navigate("/dashboard");
      return;
    }

    loadProjectRequests();
  }, [isRtnpUser, projectName, navigate]);

  const loadProjectRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rtne_requests')
        .select('*')
        .eq('project_name', decodeURIComponent(projectName || ''))
        .order('row_number', { ascending: true });

      if (error) throw error;

      setRequests(data || []);
    } catch (error: any) {
      console.error("Error loading requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clean phone numbers - removes +91, 91, spaces, dashes, etc.
  const cleanPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters first
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 91 and has more than 10 digits, remove the 91
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    
    // If starts with 0 and has 11 digits, remove the leading 0
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    
    // Return only first 10 digits if longer
    return cleaned.substring(0, 10);
  };

  const handleFieldChange = (requestId: string, field: string, value: string) => {
    // Clean phone numbers automatically
    let cleanedValue = value;
    if (field === 'primary_phone' || field === 'phone_2' || field === 'phone_3' || field === 'phone_4') {
      cleanedValue = cleanPhoneNumber(value);
    }

    // Update local state immediately with cleaned value
    setRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, [field]: cleanedValue } : req
    ));

    // Clear existing timeout
    if (saveTimeoutRef.current[`${requestId}-${field}`]) {
      clearTimeout(saveTimeoutRef.current[`${requestId}-${field}`]);
    }

    // Set new timeout to save after 1 second
    saveTimeoutRef.current[`${requestId}-${field}`] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .update({ [field]: cleanedValue })
          .eq('id', requestId);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error saving field:", error);
      }
    }, 1000);
  };

  const markAsCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('rtne_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request marked as completed",
      });

      loadProjectRequests();
    } catch (error: any) {
      console.error("Error marking as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark as completed",
        variant: "destructive",
      });
    }
  };

  if (!isRtnpUser) {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      {/* LinkedIn-style Header */}
      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-4xl text-[#0A66C2]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <nav className="hidden md:flex items-center text-sm font-medium space-x-2 text-gray-600">
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">File</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Edit</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">View</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Insert</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Format</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Data</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Tools</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => navigate("/rtnp")}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#0A66C2] hover:bg-blue-800">
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200">
                  {user?.email?.charAt(0).toUpperCase() || 'R'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between h-12 border-t border-gray-200">
            <div className="flex items-center text-sm">
              <h1 className="font-semibold text-lg text-gray-800 pr-3">{decodeURIComponent(projectName || '')} - Real-Time Numbers</h1>
              <Star className="h-5 w-5 text-gray-500 hover:text-yellow-500 cursor-pointer" />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                {pendingRequests.length} Pending
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                {completedRequests.length} Completed
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Spreadsheet Table */}
      <main className="max-w-full mx-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <span className="ml-2 text-gray-600">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-500">No requests for this project</p>
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 w-12 sticky left-0 z-10 text-gray-500">#</th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[120px]">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-600" />
                      User
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[100px]">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                      Status
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[300px]">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn Profile URL
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-600" />
                      Phone 1
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <PhoneCall className="h-4 w-4 mr-2 text-gray-600" />
                      Phone 2
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <PhoneCall className="h-4 w-4 mr-2 text-gray-600" />
                      Phone 3
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <PhoneCall className="h-4 w-4 mr-2 text-gray-600" />
                      Phone 4
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-600" />
                      Full Name
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[150px]">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                      City
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-600" />
                      Job Title
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-600" />
                      Company Name
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[250px]">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-600" />
                      Email Address
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[120px]">
                    <div className="flex items-center">
                      Action
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`group hover:bg-blue-50/50 ${
                      request.status === 'completed' ? 'bg-green-50/30' : ''
                    }`}
                  >
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm sticky left-0 bg-white group-hover:bg-blue-50/50 text-center text-gray-500 z-10">
                      {request.row_number}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium">{request.user_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      {request.status === 'pending' ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">Pending</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Done</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.linkedin_url}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.primary_phone || ''}
                        onChange={(e) => handleFieldChange(request.id, 'primary_phone', e.target.value)}
                        placeholder="Enter phone 1"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.phone_2 || ''}
                        onChange={(e) => handleFieldChange(request.id, 'phone_2', e.target.value)}
                        placeholder="Enter phone 2"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.phone_3 || ''}
                        onChange={(e) => handleFieldChange(request.id, 'phone_3', e.target.value)}
                        placeholder="Enter phone 3"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.phone_4 || ''}
                        onChange={(e) => handleFieldChange(request.id, 'phone_4', e.target.value)}
                        placeholder="Enter phone 4"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.full_name || ''}
                        onChange={(e) => handleFieldChange(request.id, 'full_name', e.target.value)}
                        placeholder="Enter name"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.city || ''}
                        onChange={(e) => handleFieldChange(request.id, 'city', e.target.value)}
                        placeholder="Enter city"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.job_title || ''}
                        onChange={(e) => handleFieldChange(request.id, 'job_title', e.target.value)}
                        placeholder="Enter job title"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.company_name || ''}
                        onChange={(e) => handleFieldChange(request.id, 'company_name', e.target.value)}
                        placeholder="Enter company"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input
                        type="text"
                        value={request.email_address || ''}
                        onChange={(e) => handleFieldChange(request.id, 'email_address', e.target.value)}
                        placeholder="Enter email"
                        disabled={request.status === 'completed'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm text-center">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => markAsCompleted(request.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1 mx-auto"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Done
                        </button>
                      )}
                      {request.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
