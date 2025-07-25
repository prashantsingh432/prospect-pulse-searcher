
export interface Prospect {
  id?: number;
  name: string;
  company: string;
  designation?: string;
  location: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
  email: string;
  linkedin: string;
}

// This is mock data for development - in production, this will come from Supabase
export const prospects: Prospect[] = [
  {
    name: "Mohit Singh Rawat",
    company: "Tata Private Limited",
    location: "Delhi",
    phone: "+91 98765 43210",
    phone2: "+91 87654 32109",
    email: "mohit.rawat@gmail.com",
    linkedin: "linkedin.com/in/mohitrawat"
  },
  {
    name: "Priya Sharma",
    company: "Infosys Technologies",
    location: "Bangalore",
    phone: "+91 87654 32109",
    email: "priya.s@outlook.com",
    linkedin: "linkedin.com/in/priyasharma"
  },
  {
    name: "Rajesh Kumar",
    company: "Wipro Limited",
    location: "Chennai",
    phone: "+91 76543 21098",
    phone2: "+91 65432 10987",
    phone3: "+91 54321 09876",
    email: "rajesh.kumar@wipro.com",
    linkedin: "linkedin.com/in/rajeshkumar"
  },
  {
    name: "Ananya Patel",
    company: "TCS",
    location: "Mumbai",
    phone: "+91 65432 10987",
    email: "ananya.p@tcs.com",
    linkedin: "linkedin.com/in/ananyapatel"
  },
  {
    name: "Vikram Malhotra",
    company: "Reliance Industries",
    location: "Mumbai",
    phone: "+91 54321 09876",
    email: "vikram.m@ril.com",
    linkedin: "linkedin.com/in/vikrammalhotra"
  },
  {
    name: "Neha Gupta",
    company: "Infosys Technologies",
    location: "Pune",
    phone: "+91 43210 98765",
    email: "neha.g@infosys.com",
    linkedin: "linkedin.com/in/nehagupta"
  },
  {
    name: "Amit Shah",
    company: "Tata Private Limited",
    location: "Ahmedabad",
    phone: "+91 32109 87654",
    email: "amit.shah@tata.com",
    linkedin: "linkedin.com/in/amitshah"
  },
  {
    name: "Divya Reddy",
    company: "Microsoft India",
    location: "Hyderabad",
    phone: "+91 21098 76543",
    email: "divya.r@microsoft.com",
    linkedin: "linkedin.com/in/divyareddy"
  },
  {
    name: "Sanjay Verma",
    company: "Wipro Limited",
    location: "Bangalore",
    phone: "+91 10987 65432",
    email: "sanjay.v@wipro.com",
    linkedin: "linkedin.com/in/sanjayverma"
  },
  {
    name: "Pooja Mehta",
    company: "TCS",
    location: "Delhi",
    phone: "+91 09876 54321",
    email: "pooja.m@tcs.com",
    linkedin: "linkedin.com/in/poojamehta"
  }
];
