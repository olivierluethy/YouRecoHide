function updateRemainingTime() {
  const remainingTimeElement = document.getElementById("remainingTime");
  const banMessageElement = document.getElementById("banMessage");

  let intervalId = null; // Variable to store the interval ID

  const updateTimer = () => {
    chrome.storage.sync.get(["blockUntil"], (result) => {
      const blockUntil = result.blockUntil || 0;
      const currentTime = new Date().getTime();

      // Check if the user is currently blocked
      if (blockUntil > currentTime) {
        const totalMillisecondsRemaining = blockUntil - currentTime;
        const minutesRemaining = Math.floor(totalMillisecondsRemaining / 60000);
        const secondsRemaining = Math.floor(
          (totalMillisecondsRemaining % 60000) / 1000
        );

        // Format seconds to always show two digits
        const formattedSeconds =
          secondsRemaining < 10 ? "0" + secondsRemaining : secondsRemaining;

        // Update the UI with the remaining time, omitting minutes if they are 0
        if (remainingTimeElement) {
          if (minutesRemaining > 0) {
            remainingTimeElement.textContent = `${minutesRemaining}m ${formattedSeconds}s`;
          } else {
            remainingTimeElement.textContent = `${formattedSeconds}s`;
          }
        }
      } else {
        clearInterval(intervalId); // Stop the interval if no block time is set or expired
        console.log("No block time set or block time has expired.");
        remainingTimeElement.innerHTML = "No block time set.";
        // Update the UI to reflect no block (optional)
        if (banMessageElement) {
          banMessageElement.textContent = "";
        }
        window.location.href = "https://www.youtube.com/";
      }
    });
  };

  // Start the update timer initially and set an interval of 1 second
  updateTimer();
  intervalId = setInterval(updateTimer, 1000);
}

chrome.storage.sync.get(["dailyWasteTimeCounter"], (result) => {
  // Clear existing rows in the table body
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = ""; // Clear previous entries

  // Check if dailyWasteTimeCounter exists
  if (result.dailyWasteTimeCounter) {
    const dailyWasteTimeCounter = result.dailyWasteTimeCounter;

    // Function to format the date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const options = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("de-DE", options); // Format in German
    };

    // Convert the object into an array of entries and sort by date (newest first)
    const sortedEntries = Object.entries(dailyWasteTimeCounter).sort((a, b) => {
      return new Date(b[0]) - new Date(a[0]); // Sort descending by date
    });

    // Iterate over each sorted entry
    for (const [date, count] of sortedEntries) {
      const formattedDate = formatDate(date);

      // Create a new row for each date
      const row = document.createElement("tr");
      const dateCell = document.createElement("td");
      const countCell = document.createElement("td");

      dateCell.style.padding = "10px";
      countCell.style.padding = "10px";

      dateCell.innerText =
        formattedDate !== "Invalid Date" ? formattedDate : "Not available";
      countCell.innerText = count;

      row.appendChild(dateCell);
      row.appendChild(countCell);
      tbody.appendChild(row);
    }
  } else {
    // If dailyWasteTimeCounter is not found, show a default message
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const countCell = document.createElement("td");

    dateCell.style.padding = "10px";
    countCell.style.padding = "10px";

    dateCell.innerText = "Not available";
    countCell.innerText = "0";

    row.appendChild(dateCell);
    row.appendChild(countCell);
    tbody.appendChild(row);
  }
});

// Call the function to start the timer
updateRemainingTime();

// Function to calculate the prediction
function calculatePrediction(dailyAverageHours) {
  const daysInWeek = 7;
  const daysInMonth = 30; // Approximation
  const daysInYear = 365;

  // Calculate total time wasted
  const weeklyWaste = dailyAverageHours * daysInWeek; // Total hours wasted in a week
  const monthlyWaste = dailyAverageHours * daysInMonth; // Total hours wasted in a month
  const yearlyWaste = dailyAverageHours * daysInYear; // Total hours wasted in a year

  // Convert hours to a more readable format (hours and minutes)
  const formatTime = (totalHours) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours} hours and ${minutes} minutes`;
  };

  // Display the predictions
  const predictionDiv = document.getElementById("prediction");
  predictionDiv.innerHTML = `
      <p>Weekly: ${formatTime(weeklyWaste)}</p>
      <p>Monthly: ${formatTime(monthlyWaste)}</p>
      <p>Yearly: ${formatTime(yearlyWaste)}</p>
  `;
}

// Assuming an average of 2 hours per day watching YouTube
const dailyAverageHours = 2;
calculatePrediction(dailyAverageHours);
