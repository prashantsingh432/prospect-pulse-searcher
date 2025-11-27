// Test new API key: 0cc20a22-890d-4d34-ae05-87e1e6820fd1
const apiKey = "0cc20a22-890d-4d34-ae05-87e1e6820fd1";

const params = new URLSearchParams({
    firstName: "Nikhil",
    lastName: "Babu",
    companyName: "Tech Mahindra"
});

const url = `https://api.lusha.com/v2/person?${params}`;

console.log("Testing NEW API key with Nikhil Babu at Tech Mahindra");
console.log("API Key:", apiKey);
console.log("URL:", url);

fetch(url, {
    method: "GET",
    headers: {
        "api_key": apiKey
    }
})
    .then(response => {
        console.log("\n✅ Status:", response.status);
        console.log("Credits left:", response.headers.get("x-daily-requests-left"));
        return response.json();
    })
    .then(data => {
        console.log("\n📊 Full Response:");
        console.log(JSON.stringify(data, null, 2));

        if (data.contact?.data) {
            console.log("\n🎉 SUCCESS! FOUND DATA:");
            console.log("Phone Numbers:", data.contact.data.phoneNumbers);
            console.log("Email Addresses:", data.contact.data.emailAddresses);
            console.log("Full Name:", data.contact.data.fullName);
            console.log("Company:", data.contact.data.company?.name);
        } else if (data.contact?.error) {
            console.log("\n⚠️ No data found:", data.contact.error);
        }
    })
    .catch(error => {
        console.error("\n❌ Error:", error);
    });
