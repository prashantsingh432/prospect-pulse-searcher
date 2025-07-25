
/**
 * Validates prospect search form based on the active tab
 */
export const validateProspectSearch = (
  activeTab: string,
  prospectName: string,
  companyName: string,
  linkedinUrl: string,
  location?: string,
  phoneNumber?: string
): { isValid: boolean; errorMessage: string } => {

  if (activeTab === "prospect-info") {
    // Check if only phone number is provided (no prospect name, company name, or location)
    const hasOnlyPhoneNumber = phoneNumber?.trim() && 
      !prospectName.trim() && 
      !companyName.trim() && 
      !location?.trim();
    
    // If only phone number is provided, company name is not required
    if (hasOnlyPhoneNumber) {
      return { isValid: true, errorMessage: "" };
    }
    
    // Otherwise, company name is required when using other fields
    if (!companyName.trim()) {
      return {
        isValid: false,
        errorMessage: "Company Name is required"
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
