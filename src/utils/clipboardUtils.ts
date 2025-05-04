
import { Prospect } from "@/data/prospects";

/**
 * Format a single prospect for clipboard copying
 */
export const formatProspectForClipboard = (prospect: Prospect): string => {
  return `Name: ${prospect.name}\nCompany: ${prospect.company}\nEmail: ${prospect.email}\nPhone: ${prospect.phone}\nLinkedIn: ${prospect.linkedin}\nLocation: ${prospect.location}`;
};

/**
 * Format multiple prospects for clipboard copying
 */
export const formatProspectsForClipboard = (prospects: Prospect[]): string => {
  return prospects.map(prospect => 
    `Name: ${prospect.name}\nCompany: ${prospect.company}\nEmail: ${prospect.email}\nPhone: ${prospect.phone}\nLinkedIn: ${prospect.linkedin}\nLocation: ${prospect.location}\n\n`
  ).join('');
};
