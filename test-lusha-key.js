// Test Lusha API key directly
const apiKey = "8ea1bea1-a121-451c-b916-e482b47e4ecc";

const testData = {
    properties: {
        firstName: "Jake",
        lastName: "Ward",
        company: "Contact"
    }
};

console.log("Testing Lusha API key...");
console.log("API Key:", apiKey);
console.log("Test Data:", JSON.stringify(testData, null, 2));

fetch("https://api.lusha.com/person", {
    method: "POST",
    headers: {
        "api_key": apiKey,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(testData)
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
