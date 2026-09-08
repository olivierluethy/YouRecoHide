let videoIntervalId = null; // Global variable to store the interval ID
let isVideoChecked = false; // Status variable to track if the video has been checked
const BLOCK_DURATION_MINUTES = 10;
let messagesDisplayed = false;

function compareVideoWithGoals() {
  let isVideoChecked = false;
  let messagesDisplayed = false;
  let videoIntervalId = null;

  if (isVideoChecked) {
    console.log("Nothing happens");
    return;
  }

  console.log("compareVideoWithGoals started");

  // Funktion zur Überprüfung von Titel und Zielen
  function checkTitleAndGoals() {
    const titleElement = document.querySelector(
      "yt-formatted-string.style-scope.ytd-watch-metadata"
    );
    const descriptionElement = document.querySelector(
      ".yt-core-attributed-string--link-inherit-color"
    );

    if (!titleElement || !descriptionElement) return;

    const title = titleElement.innerHTML.toLowerCase().replace(/[.,!?]/g, "");
    const description = descriptionElement.innerText
      .toLowerCase()
      .replace(/[.,!?]/g, "");

    if (!title || messagesDisplayed) return;

    chrome.storage.sync.get(
      ["goals", "wasteTimeCounter", "blockUntil"],
      function (data) {
        const goals = (data.goals || []).map((goal) =>
          goal.text.toLowerCase().replace(/[.,!?]/g, "")
        );
        let wasteTimeCounter = data.wasteTimeCounter || 0;
        const blockUntil = data.blockUntil || 0;
        const currentTime = new Date().getTime();

        // Reset wasteTimeCounter wenn die Blockzeit abgelaufen ist
        if (blockUntil > 0 && blockUntil <= currentTime) {
          wasteTimeCounter = 0;
          chrome.storage.sync.set({ wasteTimeCounter, blockUntil: 0 }, () =>
            console.log("Block time expired, counter reset.")
          );
        }

        // Überprüfung, ob der Titel oder die Beschreibung mit einem Ziel übereinstimmt
        const goalMatches = goals.some(
          (goal) => title.includes(goal) || description.includes(goal)
        );

        if (goalMatches) {
          console.log("Video matches goals.");
          wasteTimeCounter = Math.max(0, wasteTimeCounter - 1); // Reduziere den Zähler
          console.log("Waste Time Counter: " + wasteTimeCounter);
        } else {
          console.log("The video does not match any goals.");
          wasteTimeCounter++;
          console.log("Waste Time Counter: " + wasteTimeCounter);
        }

        chrome.storage.sync.set({ wasteTimeCounter }, function () {
          if (wasteTimeCounter >= 5) {
            const blockUntilTime =
              new Date().getTime() + BLOCK_DURATION_MINUTES * 60000;

            // Check if the alert has already been shown
            chrome.storage.sync.get(
              ["alertShown", "dailyWasteTimeCounter"],
              function (result) {
                const alertShown = result.alertShown || false;
                const dailyWasteTimeCounter =
                  result.dailyWasteTimeCounter || {}; // Change here

                const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format

                // Check if the wasteTimeCounter has reached 5
                if (wasteTimeCounter >= 5) {
                  // Check if the date has changed
                  if (!dailyWasteTimeCounter[currentDate]) {
                    // Initialize the count for the new day
                    dailyWasteTimeCounter[currentDate] = 1; // Start counting for the new day
                  } else {
                    // Increment the count for the current day
                    dailyWasteTimeCounter[currentDate]++;
                  }

                  // Update storage with the new dailyWasteTimeCounter
                  chrome.storage.sync.set(
                    { dailyWasteTimeCounter: dailyWasteTimeCounter },
                    function () {
                      if (!alertShown) {
                        // Show alert only if it hasn't been shown
                        chrome.storage.sync.set(
                          {
                            alertShown: true,
                            blockUntil: blockUntilTime,
                          },
                          function () {
                            alert(
                              `You have watched too many videos that don't match your goals. You are blocked for ${BLOCK_DURATION_MINUTES} minutes.`
                            );
                            chrome.runtime.sendMessage({
                              action: "blockSite",
                            });
                          }
                        );
                      } else {
                        // Block the site directly if the alert has already been shown
                        chrome.storage.sync.set(
                          { blockUntil: blockUntilTime },
                          function () {
                            chrome.runtime.sendMessage({
                              action: "blockSite",
                            });
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        });

        isVideoChecked = true; // Video als geprüft markieren
        clearInterval(videoIntervalId); // Intervall stoppen
      }
    );

    messagesDisplayed = true; // Nachrichten als angezeigt markieren
  }

  // DOM-Änderungen überwachen
  const observer = new MutationObserver(() => {
    const titleElement = document.querySelector(
      "yt-formatted-string.style-scope.ytd-watch-metadata"
    );
    if (titleElement && !messagesDisplayed) {
      checkTitleAndGoals();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Sicherstellen, dass Intervall für regelmäßige Checks läuft
  if (!videoIntervalId) {
    videoIntervalId = setInterval(() => {
      console.log("Checking the current video...");
      checkTitleAndGoals();
    }, 1000);
  }
}

// Set an interval to check for various conditions every second
// https://github.com/olivierluethy/YouTube-Disblock/blob/afd219c81725a1dc5a483b8593ce194ed6b3cd18/scripts/verifyVideo.js
const checkStart = setInterval(() => {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Ensure the pathname is correct and the "v" parameter exists and is valid
  if (pathname === "/watch" && searchParams.has("v")) {
    const videoId = searchParams.get("v");

    // Validate that the "v" parameter is not empty and contains exactly 11 characters
    if (videoId && videoId.length === 11) {
      const currentUrl = window.location.href;

      // Retrieve the last stored URL from chrome.storage
      chrome.storage.local.get(["lastUrl"], (result) => {
        const lastUrl = result.lastUrl;

        // Check if the current URL is different from the last stored URL
        if (currentUrl !== lastUrl) {
          console.log("New URL detected:", currentUrl);

          // Store the new URL
          chrome.storage.local.set({ lastUrl: currentUrl }, () => {
            console.log("Stored new URL:", currentUrl);
          });
          videoIntervalId = null;
          isVideoChecked = false;
          messagesDisplayed = false;
          compareVideoWithGoals();
        }
      });
    }
  }
}, 1500); // Check every 1 second

// Check if the user is allowed to access YouTube based on the blockUntil time
function checkYouTubeAccess() {
  chrome.storage.sync.get(["blockUntil"], function (data) {
    const blockUntil = data.blockUntil || 0;
    const currentTime = new Date().getTime();

    // If the current time is before the blockUntil time, block access to YouTube
    if (currentTime < blockUntil) {
      chrome.runtime.sendMessage({ action: "blockSite" });
    }
  });
}

// Call the check function if the user is anywhere on YouTube
if (window.location.href.includes("youtube.com")) {
  checkYouTubeAccess();
}

// Check if the user is allowed to access YouTube based on the blockUntil time
function checkYouTubeAccess() {
  chrome.storage.sync.get(["blockUntil"], function (data) {
    const blockUntil = data.blockUntil || 0;
    const currentTime = new Date().getTime();

    // If the current time is before the blockUntil time, block access to YouTube
    if (currentTime < blockUntil) {
      chrome.runtime.sendMessage({ action: "blockSite" });
    }
  });
}

// Call the check function if the user is anywhere on YouTube
if (window.location.href.includes("youtube.com")) {
  checkYouTubeAccess();
}
