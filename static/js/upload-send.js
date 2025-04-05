document.getElementById('data1_in').addEventListener('click', function() {
    document.getElementById('data1Upload').click();  // Opens file picker
});

document.getElementById('data1Upload').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (!file || file.type !== "text/csv") {
        alert("Invalid file format. Please upload a CSV file.");
        event.target.value = "";  // Reset file input
        return;  // Exit function
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;

        // Ensure CSV contains key variables before sending to R
        if (!csvContent.includes("ORIGIN_PT_CODE") || !csvContent.includes("DESTINATION_PT_CODE")) {
            return;  // Stop processing
        }

        sessionStorage.setItem('data1Data', csvContent);  // Store CSV in sessionStorage
        document.dispatchEvent(new Event("data1Uploaded"));  // Notify Shiny
    };

    reader.readAsText(file);  // Ensure file reading always happens
});

// Auto-import handling from Shiny
Shiny.addCustomMessageHandler("store_data1", function(data) {
    sessionStorage.setItem("data1Data", JSON.stringify(data));  // Store auto-imported data temporarily
    document.dispatchEvent(new Event("data1Uploaded"));  // Notify Shiny
});

Shiny.addCustomMessageHandler("store_data2", function(data) {
    sessionStorage.setItem("data2Data", JSON.stringify(data));  // Store data2 in sessionStorage
    document.dispatchEvent(new Event("data2Uploaded"));  // Notify Shiny
});

Shiny.addCustomMessageHandler("store_data3", function(data) {
    sessionStorage.setItem("data3Data", JSON.stringify(data));  // Store data3 in sessionStorage
    document.dispatchEvent(new Event("data3Uploaded"));  // Notify Shiny
});

document.addEventListener("data1Uploaded", function() {
    const csvContent = sessionStorage.getItem("data1Data");
    console.log("CSV uploaded/imported! Sending to Shiny.");
    Shiny.setInputValue("data1Data", csvContent);
});