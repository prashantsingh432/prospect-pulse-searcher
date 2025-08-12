import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { validateLinkedInUrl } from "@/utils/linkedInUtils";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, Star, User, MapPin, Briefcase, Building, Mail, Phone, PhoneCall, RotateCcw, RotateCw, Printer, Bold, Italic, Underline, Link, MessageSquare, Play, Share, ArrowLeft, HourglassIcon } from "lucide-react";

interface RtneRow {
  id: number;
  prospect_linkedin: string;
  full_name?: string;
  company_name?: string;
  prospect_city?: string;
  prospect_number?: string;
  prospect_email?: string;
  prospect_number2?: string;
  prospect_number3?: string;
  prospect_number4?: string;
  prospect_designation?: string;
  status?: 'ready' | 'pending' | 'processing' | 'completed' | 'failed';
}

const Rtne: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<RtneRow[]>([
    { id: 1, prospect_linkedin: "linkedin.com/in/john-doe-110a02b0", full_name: "John Doe", prospect_city: "New York", prospect_designation: "Software Engineer", company_name: "ABC Corp", prospect_email: "john@company.com", prospect_number: "+1 (555) 123-4567", prospect_number2: "+1 (555) 123-4568", prospect_number3: "+1 (555) 123-4569", prospect_number4: "+1 (555) 123-4570", status: 'ready' },
    { id: 2, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "", status: 'pending' },
    { id: 3, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "" },
    { id: 4, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "" },
    { id: 5, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "" },
    { id: 6, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "" },
    { id: 7, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "" },
    { id: 8, prospect_linkedin: "", full_name: "", prospect_city: "", prospect_designation: "", company_name: "", prospect_email: "", prospect_number: "", prospect_number2: "", prospect_number3: "", prospect_number4: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectName = user?.projectName || "Unknown Project";

  useEffect(() => {
    // Basic SEO for the page
    const title = "LinkedIn Prospects | RTNE";
    document.title = title;

    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Run Real-Time Email & Number (RTNE) enrichment for LinkedIn prospect profiles.');
    document.head.appendChild(meta);

    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    document.head.appendChild(link);
  }, []);

  const handleChange = (rowId: number, field: keyof RtneRow, value: string) => {
    setRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Process rows with LinkedIn URLs
    const validRows = rows.filter(row => row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin));
    
    for (const row of validRows) {
      try {
        const { data, error } = await supabase.functions.invoke("rtne-check-or-create", {
          body: { projectName, row },
        });

        if (error) {
          throw error;
        }

        // Update row status to completed
        setRows(prev => prev.map(r => 
          r.id === row.id ? { ...r, status: 'completed' } : r
        ));
      } catch (e: any) {
        console.error("RTNE error:", e);
        // Update row status to failed
        setRows(prev => prev.map(r => 
          r.id === row.id ? { ...r, status: 'failed' } : r
        ));
      }
    }
    setIsSubmitting(false);
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'ready':
        return (
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Ready</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center space-x-2 text-gray-400">
            <HourglassIcon className="h-4 w-4" />
            <span className="text-sm">Pending</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <span className="material-icons text-base">error</span>
            <span className="text-sm">Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

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
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Extensions</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Help</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#0A66C2] hover:bg-blue-800">
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between h-12 border-t border-gray-200">
            <div className="flex items-center text-sm">
              <h1 className="font-semibold text-lg text-gray-800 pr-3">LinkedIn Prospects</h1>
              <Star className="h-5 w-5 text-gray-500 hover:text-yellow-500 cursor-pointer" />
            </div>
            <div className="flex items-center space-x-1 text-gray-700">
              <button className="p-2 rounded-full hover:bg-gray-200" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <RotateCw className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Printer className="h-4 w-4" />
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Bold className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Italic className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Underline className="h-4 w-4" />
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Link className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <MessageSquare className="h-4 w-4" />
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button 
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Play className="h-4 w-4 text-[#0A66C2]" />
                <span>{isSubmitting ? 'Processing...' : 'Run RTNE'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spreadsheet Table */}
      <main className="max-w-full mx-auto p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 w-12 sticky left-0 z-10 text-gray-500">#</th>
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
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-600" />
                    Primary Phone
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
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[150px]">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                    Status
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-blue-50/50">
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm sticky left-0 bg-white group-hover:bg-blue-50/50 text-center text-gray-500 z-10">
                    {row.id}
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_linkedin}
                      onChange={(e) => handleChange(row.id, 'prospect_linkedin', e.target.value)}
                      placeholder={row.id === 1 ? "" : "linkedin.com/in/..."}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.full_name}
                      onChange={(e) => handleChange(row.id, 'full_name', e.target.value)}
                      placeholder={row.id === 1 ? "" : "e.g. Jane Smith"}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_city}
                      onChange={(e) => handleChange(row.id, 'prospect_city', e.target.value)}
                      placeholder={row.id === 1 ? "" : "e.g. San Francisco"}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_designation}
                      onChange={(e) => handleChange(row.id, 'prospect_designation', e.target.value)}
                      placeholder={row.id === 1 ? "" : "e.g. Product Manager"}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.company_name}
                      onChange={(e) => handleChange(row.id, 'company_name', e.target.value)}
                      placeholder={row.id === 1 ? "" : "e.g. XYZ Inc."}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="email"
                      value={row.prospect_email}
                      onChange={(e) => handleChange(row.id, 'prospect_email', e.target.value)}
                      placeholder={row.id === 1 ? "" : "e.g. jane@example.com"}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_number}
                      onChange={(e) => handleChange(row.id, 'prospect_number', e.target.value)}
                      placeholder={row.id === 1 ? "" : "+1 (555) 987-6543"}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_number2}
                      onChange={(e) => handleChange(row.id, 'prospect_number2', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_number3}
                      onChange={(e) => handleChange(row.id, 'prospect_number3', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    <input
                      className="w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-sm"
                      type="text"
                      value={row.prospect_number4}
                      onChange={(e) => handleChange(row.id, 'prospect_number4', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    {getStatusDisplay(row.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Rtne;