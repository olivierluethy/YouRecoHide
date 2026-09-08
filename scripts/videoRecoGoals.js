// https://chatgpt.com/share/6786bd5d-087c-8008-be48-4893fe8212f9
// https://chatgpt.com/share/678d111d-5568-8008-88e9-f9cde3c1df2f
function searchVideos(goals) {
  if (!goals || goals.length === 0) {
    console.log("Keine Ziele angegeben. Beende die Funktion.");
    return;
  }

  const observer = new MutationObserver(() => {
    const primaryElement = document.getElementById("primary");

    if (primaryElement) {
      observer.disconnect();

      chrome.storage.sync.get(["doubleGoals", "videoData"], (res) => {
        const storedGoals = res.doubleGoals || {};
        const storedVideos = res.videoData || {};
        const goalVideos = { ...storedVideos };

        // Filtere Ziele mit Änderungen
        const changedGoals = goals.filter((goal) => {
          const storedGoal = storedGoals[goal.id];

          return (
            !storedGoal || // Neues Ziel
            storedGoal.prompt !== goal.prompt || // Geänderter Prompt
            storedGoal.text !== goal.text // Geänderter Text
          );
        });

        // Entferne gespeicherte Ziele, die nicht mehr in der aktuellen Liste enthalten sind.
        const removedGoalIds = Object.keys(storedGoals).filter(
          (id) => !goals.some((goal) => goal.id === id)
        );

        removedGoalIds.forEach((id) => {
          delete storedGoals[id];
          delete goalVideos[id];
        });

        if (removedGoalIds.length > 0) {
          console.log("Veraltete Ziele entfernt:", removedGoalIds);
          chrome.storage.sync.set(
            { doubleGoals: storedGoals, videoData: goalVideos },
            () => console.log("Gespeicherte Ziele und Videos aktualisiert.")
          );
        }

        if (changedGoals.length === 0) {
          console.log(
            "Keine Änderungen festgestellt. Kein API-Call erforderlich."
          );
          displayVideos(goalVideos, storedGoals);

          return;
        }

        // API-Aufrufe für geänderte Ziele
        Promise.all(
          changedGoals.map((goal) => {
            const prompt = goal.prompt || goal.text;

            console.log("Der Text für die API-Anfrage lautet: " + prompt);

            const apiKey = "__REDACTED_GOOGLE_KEY__";
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
              prompt
            )}&type=video&key=${apiKey}`;

            return fetch(url)
              .then((response) => response.json())
              .then((data) => {
                const shortsRegex = /#?short/i;
                const videos = data.items
                  .map((item) => ({
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.medium.url,
                  }))
                  .filter(
                    (video) =>
                      !shortsRegex.test(video.title) &&
                      !shortsRegex.test(video.description)
                  );

                // Aktualisiere die Videos und den Speicher
                goalVideos[goal.id] = videos; // Verwende den ID-Hash als Schlüssel
                storedGoals[goal.id] = {
                  hash: goal.id, // Der Hash entspricht der ID
                  prompt: goal.prompt || goal.text,
                  text: goal.text,
                };
              });
          })
        )
          .then(() => {
            chrome.storage.sync.set(
              { doubleGoals: storedGoals, videoData: goalVideos },
              () => {
                console.log(
                  "Gespeicherte Ziele und Videos aktualisiert:",
                  goalVideos
                );
                displayVideos(goalVideos, storedGoals);
              }
            );
          })
          .catch((error) =>
            console.error("Fehler beim Abrufen der Videos:", error)
          );
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to display videos grouped by goal
function displayVideos(goalVideos, storedGoals) {
  const primaryElement = document.getElementById("primary");
  primaryElement.innerHTML = "";

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "goal-buttons";

  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "8px";
  buttonContainer.style.marginBottom = "1rem";
  buttonContainer.style.padding = "1rem";
  buttonContainer.style.position = "fixed";
  buttonContainer.style.width = "100%";
  buttonContainer.style.top = "50px";
  buttonContainer.style.backgroundColor = "#0f0f0f";
  buttonContainer.style.zIndex = "1000";

  for (const [goalKey, videos] of Object.entries(goalVideos)) {
    const goalName = storedGoals[goalKey]?.text || "Unbekanntes Ziel";

    const goalButton = document.createElement("button");
    goalButton.textContent = goalName;
    goalButton.title = "Klicke, um zum Abschnitt von " + goalName;

    goalButton.style.padding = "0.8rem 1.2rem";
    goalButton.style.borderRadius = "6px";
    goalButton.style.cursor = "pointer";
    goalButton.style.backgroundColor = "rgba(255,255,255,0.2)";
    goalButton.style.color = "white";
    goalButton.style.border = "none";
    goalButton.style.transition = "background-color 0.3s";

    goalButton.addEventListener("click", () => {
      const goalElement = document.getElementById(`goal-${goalKey}`);
      const offset = 110;

      const elementPosition =
        goalElement.getBoundingClientRect().top + window.scrollY;
      const targetPosition = elementPosition - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    });

    goalButton.addEventListener("mouseover", () => {
      goalButton.style.backgroundColor = "#555";
    });
    goalButton.addEventListener("mouseout", () => {
      goalButton.style.backgroundColor = "#333";
    });

    buttonContainer.appendChild(goalButton);
  }

  primaryElement.appendChild(buttonContainer);

  if (Object.keys(goalVideos).length === 0) {
    primaryElement.innerHTML += "<p>Keine Videoempfehlungen gefunden.</p>";
    return;
  }

  let isFirstGoal = true;

  for (const [goalKey, videos] of Object.entries(goalVideos)) {
    const goalName = storedGoals[goalKey]?.text || "Unbekanntes Ziel";

    const goalSection = document.createElement("div");
    goalSection.id = `goal-${goalKey}`;
    goalSection.style.marginBottom = "2rem";

    const goalTitle = document.createElement("h2");
    goalTitle.textContent = goalName;
    goalTitle.style.color = "white";

    if (isFirstGoal) {
      goalTitle.style.marginTop = "6rem";
      isFirstGoal = false;
    } else {
      goalTitle.style.marginTop = "2rem";
    }
    goalTitle.style.marginLeft = "1rem";
    goalTitle.style.marginBottom = "1rem";
    goalSection.appendChild(goalTitle);

    const videoContainer = document.createElement("div");
    videoContainer.style.display = "flex";
    videoContainer.style.flexWrap = "wrap";
    videoContainer.style.gap = "16px";
    videoContainer.style.justifyContent = "flex-start";
    videoContainer.style.marginLeft = "1rem";

    videos.forEach((video) => {
      const videoElement = document.createElement("div");
      videoElement.style.flex = "1 1 300px";
      videoElement.style.maxWidth = "315px";
      videoElement.style.borderRadius = "8px";
      videoElement.style.overflow = "hidden";
      videoElement.style.backgroundColor = "black";
      videoElement.style.boxShadow =
        "0px 0px 10px 0px rgba(255, 255, 255, 0.8)";
      videoElement.style.transition = "background-color 0.5s ease-in-out";

      videoElement.innerHTML = `
        <a title='${video.description}' style='text-decoration:none;' href="${video.url}" target="_blank">
          <img width="100%" height="180" src="${video.thumbnail}" alt="${video.title}" style="display: block; border-radius: 8px 8px 0 0;">
          <h3 style="color: white; margin: 0.5rem 0.5rem 0 0.5rem;">${video.title}</h3>
          <p style="color: white; margin: 0.5rem;">${video.description}</p>
        </a>
      `;

      const anchorElement = videoElement.querySelector("a");
      anchorElement.style.color = "white";
      anchorElement.addEventListener("mouseover", () => {
        videoElement.style.backgroundColor = "#484848";
      });
      anchorElement.addEventListener("mouseout", () => {
        videoElement.style.backgroundColor = "black";
      });

      videoContainer.appendChild(videoElement);
    });

    goalSection.appendChild(videoContainer);
    primaryElement.appendChild(goalSection);
  }
}
