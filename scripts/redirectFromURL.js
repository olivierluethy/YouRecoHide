// Function to redirect traffic from Trending page to Subscriptions page
function cheatingRedirect() {
  if (window.location.pathname.startsWith("/feed/trending")) {
    window.location.href = "https://www.youtube.com/feed/subscriptions";
  }
}

// YouTube-Weiterleitung zur Abonnementseite
function redirectToSubscriptions() {
  if (
    window.location.hostname === "www.youtube.com" &&
    window.location.pathname === "/"
  ) {
    // Check if there are any goals
    chrome.storage.sync.get("goals", function (data) {
      const goals = data.goals || [];

      if (goals.length > 0) {
        // If goals exist, load recommended videos
        searchVideos(goals);
      } else {
        // If there are no goals, check hideFeed value
        chrome.storage.local.get(["hideFeed"], (res) => {
          const hideFeed = res.hideFeed ?? false; // Default to false if not set

          // Hide the "Abos" button based on the hideFeed value
          const abosButton = document.querySelector(
            '.yt-simple-endpoint[title="Abos"]'
          );
          if (abosButton) {
            abosButton.style.display = hideFeed ? "none" : "block"; // Hide or show based on hideFeed
          }

          if (hideFeed === false) {
            // Redirect to the playlist section if hideFeed is false
            window.location.href = "https://www.youtube.com/feed/playlists";
          } else {
            // Redirect to the subscriptions page if hideFeed is true
            window.location.href = "https://www.youtube.com/feed/subscriptions";
          }
        });
      }
    });
  }
}
checkIfHome = setInterval(() => {
  if (window.location.href.includes("www.youtube.com/")) {
    console.log("Inside of home page")
    redirectToSubscriptions();
  }
}, 1000);

// If a friend sends a shorts video to me and I click, I won't be able to see it and get redirected to youtube.com
function clickToShortsBlocker() {
  // Check if the current URL contains "/shorts/"
  if (window.location.href.includes("/shorts/")) {
    // Redirect to the main YouTube page
    window.location.href = "https://www.youtube.com";
  }
}

window.onload = clickToShortsBlocker;

let isOnPlaylistPage = false; // Flag to check if we are on the playlist page

function checkIfLogin() {
  // Initial check for the URL
  if (
    window.location.href.startsWith("https://www.youtube.com/feed/playlists")
  ) {
    console.log("Loginüberprüfung aktiviert!");
    isOnPlaylistPage = true; // Set flag to true
    console.log("Du bist in der Playlist!");

    // Create an interval to check for alerts
    const intervalId = setInterval(() => {
      // Check if we are still on the playlist page
      if (!isOnPlaylistPage) {
        clearInterval(intervalId); // Stop the interval if we are not on the playlist page
        return;
      }

      // Get the element with the ID "alerts"
      const alertsElement = document.getElementById("alerts");

      // Check if the alerts element exists
      if (alertsElement) {
        console.log("Der Alert Text existiert!");

        // Find the yt-alert-renderer within alertsElement
        const alertRenderer = alertsElement.querySelector(
          ".style-scope.ytd-browse"
        );
        if (alertRenderer) {
          // Check for the element with the class "ERROR" within alertRenderer
          const errorElement = alertRenderer.querySelector(".ERROR");
          if (errorElement) {
            // Hide the alerts element
            alertsElement.style.display = "none";

            // Find the main element
            const mainElement = document.querySelector(
              ".style-scope.ytd-page-manager[role='main']"
            );
            if (mainElement) {
              const h1Element = document.createElement("h1");
              h1Element.textContent = "You are currently not logged in";
              h1Element.style.cssText = `
                color: white;
                font-size: 30px;
              `;
              mainElement.insertBefore(h1Element, mainElement.firstChild);

              // Create a button
              const loginButton = document.createElement("button");
              loginButton.textContent = "Sign up for YouTube";
              loginButton.style.cssText = `
                background-color: blue;
                color: white;
                margin-top: 20px;
                padding: 18px 32px;
                cursor: pointer;
                border: none;
                box-shadow: 0px 0px 29px 0px rgba(255, 255, 255, 0.8);
                font-size: 15px;
              `;

              // Add the button after the h1 element
              mainElement.insertBefore(loginButton, h1Element.nextSibling);

              // Add click event listener for the button
              loginButton.addEventListener("click", () => {
                window.location.href =
                  "https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Dde%26next%3Dhttps%253A%252F%252Fwww.youtube.com%252Fplaylist%253Flist%253DWL&hl=de&ec=65620";
              });

              // Remove Discover Section
              document.querySelector(
                ".style-scope.ytd-guide-renderer:nth-child(4)"
              ).style.display = "none";
              clearInterval(intervalId); // Stop the interval when both elements are found
            } else {
              console.warn(
                "Element mit der Klasse 'style-scope.ytd-page-manager[role='main']' nicht gefunden."
              );
            }
          }
        }
      } else {
        console.warn("Element mit der ID 'alerts' nicht gefunden.");
      }
    }, 250);

    // Set up a MutationObserver to listen for URL changes
    const observer = new MutationObserver(() => {
      if (
        !window.location.href.startsWith(
          "https://www.youtube.com/feed/playlists"
        )
      ) {
        isOnPlaylistPage = false; // Update the flag when leaving the playlist page
      }
    });

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

checkIfLogin();

/* Interaction with YouTube Logo Click */
// Funktion zum Hinzufügen des Event Listeners zum YouTube-Logo
function addLogoClickListener() {
  const logo = document.getElementById("logo");
  if (logo) {
    logo.addEventListener("click", (event) => {
      event.preventDefault(); // Standardverhalten des Links verhindern

      // Retrieve the current value of hideFeed from storage
      chrome.storage.local.get(["hideFeed"], (res) => {
        const hideFeed = res.hideFeed ?? false; // Default to false if not set
        if (hideFeed === false) {
          chrome.storage.sync.get("goals", function (data) {
            const goals = data.goals || [];
            // If no goals are defined
            if (goals.length > 0) {
              window.location.href = "https://www.youtube.com/";
            } else {
              // Redirect to the playlist section if hideFeed is false
              document.querySelector(
                '.yt-simple-endpoint[title="Abos"]'
              ).style.display = "none";
              // window.location.href = "https://www.youtube.com/feed/playlists";
            }
          });
        } else {
          // Redirect to the subscriptions page if hideFeed is true
          redirectToSubscriptions();
        }
      });
    });
  }
}

// MutationObserver zur Beobachtung von DOM-Änderungen
const observer = new MutationObserver((mutations) => {
  addLogoClickListener(); // Überprüfe das Vorhandensein des Logos und füge den Listener hinzu
});

// Beobachte den Body auf Änderungen
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
