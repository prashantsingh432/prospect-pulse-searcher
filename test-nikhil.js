// Direct test of Lusha API with Nikhil Babu at Tech Mahindra
const apiKey = "8ea1bea1-a121-451c-b916-e482b47e4ecc";

const params = new URLSearchParams({
    firstName: "Nikhil",
    lastName: "Babu",
    companyName: "Tech Mahindra"
});

const url = `https://api.lusha.com/v2/person?${params}`;

console.log("Testing: Nikhil Babu at Tech Mahindra");
console.log("URL:", url);

fetch(url, {
    method: "GET",
    headers: {
        "api_key": apiKey
    }
})
    .then(response => {
        console.log("\nStatus:", response.status);
        console.log("Credits left:", response.headers.get("x-daily-requests-left"));
        return response.json();
    })
    .then(data => {
        console.log("\nFull Response:");
        console.log(JSON.stringify(data, null, 2));

        if (data.contact?.data) {
            console.log("\n✅ FOUND DATA:");
            console.log("Phone:", data.contact.data.phoneNumbers);
            console.log("Email:", data.contact.data.emailAddresses);
        } else {
            console.log("\n❌ No data found");
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
