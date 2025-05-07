/**
 * Validates prospect search form based on the active tab
 */
export const validateProspectSearch = (
  activeTab: string, 
  prospectName: string, 
  companyName: string, 
  linkedinUrl: string
): { isValid: boolean; errorMessage: string } => {
  
  if (activeTab === "prospect-info") {
    // Require BOTH prospect name and company name
    if (!prospectName.trim() || !companyName.trim()) {
      return {
        isValid: false,
        errorMessage: "Both Prospect Name and Company Name are required"
      };
    }
  } else if (activeTab === "linkedin-url") {
    // For LinkedIn tab, require the LinkedIn URL
    if (!linkedinUrl.trim()) {
      return {
        isValid: false,
        errorMessage: "LinkedIn URL is required"
      };
    }
    
    // Simple validation for LinkedIn URL format
    const linkedinPattern = /linkedin\.com/i;
    if (!linkedinPattern.test(linkedinUrl.trim())) {
      return {
        isValid: false,
        errorMessage: "Please enter a URL containing 'linkedin.com'"
      };
    }
  }
  
  return { isValid: true, errorMessage: "" };
};
