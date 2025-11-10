
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
    // For LinkedIn tab, require at least one LinkedIn URL
    if (!linkedinUrl.trim()) {
      return {
        isValid: false,
        errorMessage: "LinkedIn URL is required"
      };
    }

    // Parse multiple URLs
    const urls = linkedinUrl.split(/[\n,]+/).filter(url => url.trim());
    
    // Check URL count limit
    if (urls.length > 5) {
      return {
        isValid: false,
        errorMessage: "Maximum 5 URLs allowed"
      };
    }

    // Validate each URL format
    const linkedinPattern = /linkedin\.com/i;
    const invalidUrls = urls.filter(url => !linkedinPattern.test(url.trim()));
    
    if (invalidUrls.length > 0) {
      return {
        isValid: false,
        errorMessage: `${invalidUrls.length} invalid URL(s) - must contain 'linkedin.com'`
      };
    }
  }

  return { isValid: true, errorMessage: "" };
};
