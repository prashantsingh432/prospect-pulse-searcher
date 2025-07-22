
/**
 * Validates prospect search form based on the active tab
 */
export const validateProspectSearch = (
  activeTab: string,
  prospectName: string,
  companyName: string,
  linkedinUrl: string,
  phoneNumber?: string
): { isValid: boolean; errorMessage: string } => {

  if (activeTab === "prospect-info") {
    // Only require company name - prospect name and location are optional
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
  } else if (activeTab === "phone-number") {
    if (!phoneNumber?.trim()) {
      return {
        isValid: false,
        errorMessage: "Phone number is required for phone number search."
      };
    }
    // Basic phone number validation - should have at least 6 digits
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.length < 6) {
      return {
        isValid: false,
        errorMessage: "Phone number should have at least 6 digits."
      };
    }
  }

  return { isValid: true, errorMessage: "" };
};
