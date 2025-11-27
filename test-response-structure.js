// Test Lusha API v2 response structure
const apiKey = "8ea1bea1-a121-451c-b916-e482b47e4ecc";

// Test with a person who should have data
const params = new URLSearchParams({
    firstName: "Prashant",
    lastName: "Michael",
    companyName: "24/7"
});

const url = `https://api.lusha.com/v2/person?${params}`;

console.log("Testing Lusha API v2 response structure...");
console.log("URL:", url);

fetch(url, {
    method: "GET",
    headers: {
        "api_key": apiKey
    }
})
    .then(response => {
        console.log("\n=== RESPONSE HEADERS ===");
        console.log("Status:", response.status);
        console.log("x-daily-requests-left:", response.headers.get("x-daily-requests-left"));
        return response.json();
    })
    .then(data => {
        console.log("\n=== FULL RESPONSE DATA ===");
        console.log(JSON.stringify(data, null, 2));

        console.log("\n=== PARSED FIELDS ===");
        console.log("data.contact:", data.contact ? "EXISTS" : "NULL");
        console.log("data.contact.data:", data.contact?.data ? "EXISTS" : "NULL");
        console.log("data.contact.error:", data.contact?.error ? "EXISTS" : "NULL");

        if (data.contact?.data) {
            console.log("\n=== CONTACT DATA ===");
            console.log("phoneNumbers:", data.contact.data.phoneNumbers);
            console.log("emailAddresses:", data.contact.data.emailAddresses);
            console.log("fullName:", data.contact.data.fullName);
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
