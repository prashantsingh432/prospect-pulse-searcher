// Test Lusha API key with CORRECT method (GET with query params)
const apiKey = "8ea1bea1-a121-451c-b916-e482b47e4ecc";

// Build query string
const params = new URLSearchParams({
    firstName: "Satya",
    lastName: "Nadella",
    companyName: "Microsoft"
});

const url = `https://api.lusha.com/v2/person?${params}`;

console.log("Testing Lusha API key with GET method...");
console.log("API Key:", apiKey);
console.log("URL:", url);

fetch(url, {
    method: "GET",  // ✅ GET not POST!
    headers: {
        "api_key": apiKey
    }
})
    .then(response => {
        console.log("Response Status:", response.status);
        console.log("Response Headers:");
        console.log("  x-daily-requests-left:", response.headers.get("x-daily-requests-left"));
        console.log("  x-monthly-requests-left:", response.headers.get("x-monthly-requests-left"));
        return response.json();
    })
    .then(data => {
        console.log("Response Data:", JSON.stringify(data, null, 2));
    })
    .catch(error => {
        console.error("Error:", error);
    });
