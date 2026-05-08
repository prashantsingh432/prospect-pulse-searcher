
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/data/prospects";
import { useProspectSearch } from "@/hooks/useProspectSearch";
import { DispositionWarning } from "@/components/DispositionWarning";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    prospectName,
    setProspectName,
    companyName,
    setCompanyName,
    location,
    setLocation,
    phoneNumber,
    setPhoneNumber,
    linkedinUrl,
    setLinkedinUrl,
    searchResults,
    setSearchResults,
    hasSearched,
    isSearching,
    validationError,
    connectionStatus,
    handleDirectSearch: handleSearch, // Use direct search to bypass missing modal
    testConnection,
  } = useProspectSearch();

  const { data: allProspects, error: fetchError } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      try {
        const { data: prospectsData, error: prospectsError } = await supabase
          .from("prospects")
          .select("*");
        if (prospectsError) throw prospectsError;
        return (prospectsData || []).map((record) => ({
          name: record.full_name,
          company: record.company_name,
          designation: record.prospect_designation || "",
          location: record.prospect_city || "",
          phone: record.prospect_number || "",
          phone2: record.prospect_number2 || "",
          phone3: record.prospect_number3 || "",
          phone4: record.prospect_number4 || "",
          email: record.prospect_email || "",
          linkedin: record.prospect_linkedin || "",
        })) as Prospect[];
      } catch {
        return [] as Prospect[];
      }
    },
    enabled: connectionStatus?.connected,
  });

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const handleNewSearch = () => {
    setCompanyName("");
    setProspectName("");
    setLocation("");
    setPhoneNumber("");
    setSearchResults([]);
  };

  const displayResults = hasSearched || searchResults.length > 0;

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: "#f7f9fb", color: "#191c1e" }}>

      {/* ─── Top NavBar ─── */}
      <header style={{ backgroundColor: "#f7f9fb", boxShadow: "0 1px 0 #c7c4d833" }}
        className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="text-xl font-extrabold tracking-tight font-headline" style={{ color: "#191c1e" }}>
            LeadCurator
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="font-medium transition-colors font-label uppercase tracking-wider pb-1"
              style={{ fontSize: "0.6875rem", color: "#191c1e99" }}
              href="#">Dashboard</a>
            <a className="border-b-2 font-bold pb-1 font-label uppercase tracking-wider"
              style={{ fontSize: "0.6875rem", color: "#4F46E5", borderColor: "#4F46E5" }}
              href="#">Prospects</a>
            <a className="font-medium transition-colors font-label uppercase tracking-wider"
              style={{ fontSize: "0.6875rem", color: "#191c1e99" }}
              href="#">Campaigns</a>
            {isAdmin() && (
              <Link className="font-medium transition-colors font-label uppercase tracking-wider"
                style={{ fontSize: "0.6875rem", color: "#191c1e99" }}
                to="/admin">Admin</Link>
            )}
            {isSuperAdmin() && (
              <Link className="font-medium transition-colors font-label uppercase tracking-wider"
                style={{ fontSize: "0.6875rem", color: "#191c1e99" }}
                to="/data-management">Data</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined p-2 rounded-md transition-all"
            style={{ color: "#464555" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eceef0")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
            notifications
          </button>
          {isAdmin() && (
            <button className="material-symbols-outlined p-2 rounded-md transition-all"
              style={{ color: "#464555" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eceef0")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              onClick={() => window.location.href = '/admin'}>
              settings
            </button>
          )}
          <div className="h-8 mx-2" style={{ width: "1px", backgroundColor: "#c7c4d833" }}></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-tighter" style={{ color: "#191c1e" }}>
                {user?.fullName || user?.email?.split("@")[0] || "User"}
              </p>
              <button
                onClick={async () => { await logout(); navigate("/login"); }}
                className="transition-colors hover:underline"
                style={{ fontSize: "0.625rem", color: "#464555" }}>
                Logout
              </button>
            </div>
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold font-headline uppercase text-white"
              style={{ backgroundColor: "#4f46e5" }}>
              {(user?.fullName || user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Layout ─── */}
      <main className="mx-auto px-8 py-8 flex gap-8" style={{ maxWidth: "1400px" }}>

        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:flex flex-col shrink-0 gap-6" style={{ width: "256px" }}>
          {/* Nav card */}
          <div className="rounded-xl p-4 flex flex-col gap-2"
            style={{ backgroundColor: "#eceef0", boxShadow: "0 24px 40px -4px rgba(25,28,30,0.06)" }}>
            <div className="px-3 py-2 mb-2">
              <h2 className="font-headline text-lg font-bold" style={{ color: "#191c1e" }}>Intelligence</h2>
              <p className="font-label uppercase tracking-wider" style={{ fontSize: "0.6875rem", color: "#464555" }}>
                Prospecting Engine
              </p>
            </div>
            <nav className="flex flex-col gap-1">
              {/* Find Leads (prospect-info) */}
              <button
                onClick={() => setActiveTab("prospect-info")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-transform duration-200 hover:translate-x-1"
                style={{
                  backgroundColor: activeTab === "prospect-info" ? "#ffffff" : "transparent",
                  color: activeTab === "prospect-info" ? "#3525cd" : "#464555",
                  fontWeight: activeTab === "prospect-info" ? "bold" : "normal",
                  boxShadow: activeTab === "prospect-info" ? "0 1px 3px rgba(25,28,30,0.1)" : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>search</span>
                <span className="text-sm font-body">Find Leads</span>
              </button>
              
              {/* Find by Link URL */}
              <button
                onClick={() => setActiveTab("linkedin-url")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-transform duration-200 hover:translate-x-1"
                style={{
                  backgroundColor: activeTab === "linkedin-url" ? "#ffffff" : "transparent",
                  color: activeTab === "linkedin-url" ? "#3525cd" : "#464555",
                  fontWeight: activeTab === "linkedin-url" ? "bold" : "normal",
                  boxShadow: activeTab === "linkedin-url" ? "0 1px 3px rgba(25,28,30,0.1)" : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>link</span>
                <span className="text-sm font-body">Find by Link URL</span>
              </button>
              {/* RTNE */}
              <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-transform duration-200 hover:translate-x-1"
                style={{ color: "#464555" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f2f4f6")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                to="/rtne">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>bolt</span>
                <span className="text-sm font-body">Real-time Name &amp; Email</span>
              </Link>
            </nav>
            <button
              onClick={handleNewSearch}
              className="mt-4 w-full text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(to right, #3525cd, #4f46e5)",
                boxShadow: "0 8px 24px -4px rgba(53,37,205,0.2)",
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              New Search
            </button>
          </div>

          {/* Help & Settings card */}
          <div className="rounded-xl p-4 flex flex-col gap-1" style={{ backgroundColor: "#eceef0" }}>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
              style={{ color: "#464555" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f2f4f6")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              href="#">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>help</span>
              <span className="text-sm font-body">Help Center</span>
            </a>
            {isAdmin() && (
              <Link className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                style={{ color: "#464555" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f2f4f6")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                to="/admin">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
                <span className="text-sm font-body">Settings</span>
              </Link>
            )}

          </div>
        </aside>

        {/* ─── Content Canvas ─── */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">

          <DispositionWarning />

          {/* Page Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight" style={{ color: "#191c1e" }}>
                Prospect Finder
              </h1>
              <p className="mt-1 font-body" style={{ color: "#464555" }}>
                Identify and curate high-intent prospects across 20M+ entities.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  fontSize: "0.6875rem",
                  backgroundColor: "rgba(182,180,255,0.3)",
                  color: "#58579b",
                }}>
                {allProspects ? `DB Records: ${allProspects.length}` : "Credits: Loading..."}
              </span>
            </div>
          </div>

          {/* ─── Search Card ─── */}
          <section className="rounded-xl p-8 relative overflow-hidden"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 24px 40px -4px rgba(25,28,30,0.06)",
            }}>
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"
              style={{ backgroundColor: "rgba(79,70,229,0.05)" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <span className="material-symbols-outlined" style={{ color: "#3525cd" }}>filter_list</span>
                <h2 className="font-headline text-xl font-bold" style={{ color: "#191c1e" }}>Search Parameters</h2>
              </div>

              {activeTab === "prospect-info" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="block font-bold uppercase tracking-widest ml-1"
                      style={{ fontSize: "0.625rem", color: "rgba(70,69,85,0.6)" }}>
                      Company Name *
                    </label>
                    <div className="relative">
                      <input
                        className="w-full border-none rounded-xl px-4 py-3 text-sm transition-all font-body outline-none focus:ring-1"
                        style={{
                          backgroundColor: "rgba(242,244,246,0.5)",
                          color: "#191c1e",
                          caretColor: "#3525cd",
                          boxShadow: "none",
                        }}
                        onFocus={e => (e.currentTarget.style.outline = "none", e.currentTarget.style.boxShadow = "0 0 0 1.5px #3525cd")}
                        onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                        placeholder="e.g. Stripe"
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3"
                        style={{ fontSize: "18px", color: "rgba(70,69,85,0.2)" }}>
                        corporate_fare
                      </span>
                    </div>
                  </div>

                  {/* Prospect Name */}
                  <div className="space-y-1.5">
                    <label className="block font-bold uppercase tracking-widest ml-1"
                      style={{ fontSize: "0.625rem", color: "rgba(70,69,85,0.6)" }}>
                      Prospect Name
                    </label>
                    <input
                      className="w-full border-none rounded-xl px-4 py-3 text-sm font-body"
                      style={{ backgroundColor: "rgba(242,244,246,0.5)", color: "#191c1e" }}
                      onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 1.5px #3525cd")}
                      onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                      placeholder="e.g. Sarah Chen"
                      type="text"
                      value={prospectName}
                      onChange={e => setProspectName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="block font-bold uppercase tracking-widest ml-1"
                      style={{ fontSize: "0.625rem", color: "rgba(70,69,85,0.6)" }}>
                      Location
                    </label>
                    <div className="relative">
                      <input
                        className="w-full border-none rounded-xl px-4 py-3 text-sm font-body"
                        style={{ backgroundColor: "rgba(242,244,246,0.5)", color: "#191c1e" }}
                        onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 1.5px #3525cd")}
                        onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                        placeholder="San Francisco, CA"
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3"
                        style={{ fontSize: "18px", color: "rgba(70,69,85,0.2)" }}>
                        location_on
                      </span>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block font-bold uppercase tracking-widest ml-1"
                      style={{ fontSize: "0.625rem", color: "rgba(70,69,85,0.6)" }}>
                      Phone Number
                    </label>
                    <input
                      className="w-full border-none rounded-xl px-4 py-3 text-sm font-body"
                      style={{ backgroundColor: "rgba(242,244,246,0.5)", color: "#191c1e" }}
                      onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 1.5px #3525cd")}
                      onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div className="space-y-1.5">
                    <label className="block font-bold uppercase tracking-widest ml-1"
                      style={{ fontSize: "0.625rem", color: "rgba(70,69,85,0.6)" }}>
                      LinkedIn URL(s) *
                    </label>
                    <div className="relative">
                      <textarea
                        className="w-full border-none rounded-xl px-4 py-3 text-sm font-body resize-none h-32"
                        style={{
                          backgroundColor: "rgba(242,244,246,0.5)",
                          color: "#191c1e",
                          caretColor: "#3525cd",
                        }}
                        onFocus={e => (e.currentTarget.style.outline = "none", e.currentTarget.style.boxShadow = "0 0 0 1.5px #3525cd")}
                        onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                        placeholder="https://www.linkedin.com/in/sarahchen&#10;https://www.linkedin.com/in/johndoe"
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3"
                        style={{ fontSize: "18px", color: "rgba(70,69,85,0.2)" }}>
                        link
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Enter up to 5 LinkedIn URLs separated by commas or newlines.</p>
                  </div>
                </div>
              )}

              {validationError && (
                <p className="mt-3 text-xs font-medium" style={{ color: "#ba1a1a" }}>{validationError}</p>
              )}

              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="flex items-center gap-2 px-10 py-3 rounded-full font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: isSearching ? "#4f46e5" : "#3525cd",
                    color: "#ffffff",
                    boxShadow: "0 8px 24px -4px rgba(53,37,205,0.15)",
                    opacity: isSearching ? 0.75 : 1,
                  }}>
                  <span className={`material-symbols-outlined ${isSearching ? "animate-spin" : ""}`}
                    style={{ fontSize: "18px" }}>
                    {isSearching ? "progress_activity" : "search"}
                  </span>
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Results Table ─── */}
          {displayResults && (
            <section className="rounded-xl p-1 overflow-hidden" style={{ backgroundColor: "#f2f4f6" }}>
              <div className="rounded-xl overflow-x-auto" style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(25,28,30,0.06)" }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(242,244,246,0.3)" }}>
                      {["Company", "Prospect", "Designation", "Contact", "Actions"].map((h, i) => (
                        <th key={h} className={`px-6 py-4 font-bold uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}
                          style={{ fontSize: "0.6875rem", color: "#464555" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: "#464555" }}>
                          No prospects found. Try adjusting your search parameters.
                        </td>
                      </tr>
                    ) : (
                      searchResults.map((result, idx) => (
                        <tr key={idx}
                          className="transition-colors"
                          style={{ borderTop: idx > 0 ? "1px solid #f2f4f6" : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(242,244,246,0.3)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>

                          {/* Company */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg flex items-center justify-center font-headline font-bold"
                                style={{ backgroundColor: "#eceef0", color: "#3525cd" }}>
                                {(result.company || "C")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: "#191c1e" }}>{result.company || "Unknown"}</p>
                                <p style={{ fontSize: "0.6875rem", color: "#464555" }}>{result.location || "—"}</p>
                              </div>
                            </div>
                          </td>

                          {/* Prospect */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs font-headline"
                                style={{ backgroundColor: "#eceef0", color: "#3525cd" }}>
                                {(result.name || "?")[0].toUpperCase()}
                              </div>
                              <p className="text-sm font-medium" style={{ color: "#191c1e" }}>{result.name || "—"}</p>
                            </div>
                          </td>

                          {/* Designation */}
                          <td className="px-6 py-5">
                            <p className="text-sm" style={{ color: "#464555" }}>{result.designation || "—"}</p>
                          </td>

                          {/* Contact */}
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              {result.email && (
                                <div className="flex items-center gap-1 group/item">
                                  <a className="text-xs font-medium hover:underline" style={{ color: "#3525cd" }}
                                    href={`mailto:${result.email}`}>{result.email}</a>
                                  <span className="material-symbols-outlined cursor-pointer transition-opacity"
                                    style={{ fontSize: "14px", color: "#464555", opacity: 0.3 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.3")}
                                    onClick={() => navigator.clipboard.writeText(result.email!)}>
                                    content_copy
                                  </span>
                                </div>
                              )}
                              {result.phone && (
                                <div className="flex items-center gap-1 group/item">
                                  <a className="text-xs hover:underline" style={{ color: "#464555" }}
                                    href={`tel:${result.phone}`}>{result.phone}</a>
                                  <span className="material-symbols-outlined cursor-pointer transition-opacity"
                                    style={{ fontSize: "14px", color: "#464555", opacity: 0.3 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.3")}
                                    onClick={() => navigator.clipboard.writeText(result.phone!)}>
                                    content_copy
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-2 rounded-lg material-symbols-outlined transition-all"
                                style={{ fontSize: "18px", color: "#464555" }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eceef0")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                title="Edit Prospect">edit</button>
                              <button className="p-2 rounded-lg font-bold transition-all font-headline"
                                style={{ fontSize: "11px", color: "#3525cd" }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eceef0")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                title="Dispose">GD</button>
                              <button className="p-2 rounded-lg material-symbols-outlined transition-all"
                                style={{ fontSize: "18px", color: "#ba1a1a" }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eceef0")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                title="Delete">delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination row */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ backgroundColor: "rgba(242,244,246,0.3)" }}>
                <p className="font-bold uppercase tracking-wider"
                  style={{ fontSize: "0.6875rem", color: "#464555" }}>
                  Showing {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all material-symbols-outlined"
                    style={{ fontSize: "18px", backgroundColor: "#ffffff", color: "#464555" }}>
                    chevron_left
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs"
                    style={{ backgroundColor: "#3525cd", color: "#ffffff" }}>
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg shadow-sm text-xs font-medium transition-all"
                    style={{ backgroundColor: "#ffffff", color: "#464555" }}>
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all material-symbols-outlined"
                    style={{ fontSize: "18px", backgroundColor: "#ffffff", color: "#464555" }}>
                    chevron_right
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-3 px-4 z-50"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.05)",
        }}>
        <button className="flex flex-col items-center gap-1" style={{ color: "#464555" }}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-bold uppercase tracking-tighter" style={{ fontSize: "10px" }}>Dash</span>
        </button>
        <button className="flex flex-col items-center gap-1" style={{ color: "#3525cd" }}>
          <span className="material-symbols-outlined">search</span>
          <span className="font-bold uppercase tracking-tighter" style={{ fontSize: "10px" }}>Find</span>
        </button>
        <button className="flex flex-col items-center gap-1" style={{ color: "#464555" }}>
          <span className="material-symbols-outlined">link</span>
          <span className="font-bold uppercase tracking-tighter" style={{ fontSize: "10px" }}>Links</span>
        </button>
        <button className="flex flex-col items-center gap-1" style={{ color: "#464555" }}>
          <span className="material-symbols-outlined">person</span>
          <span className="font-bold uppercase tracking-tighter" style={{ fontSize: "10px" }}>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
