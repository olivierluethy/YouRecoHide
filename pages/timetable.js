chrome.storage.local.get("wastedTime", function (data) {
  const wastedTime = data.wastedTime || {}; // Lade gespeicherte Daten oder initialisiere ein leeres Objekt
  const tableBody = document.getElementById("logTableBody");
  const totalTimeElement = document.getElementById("totalTime"); // Element für die Gesamtsumme

  // Vorherige Tabellenzeilen leeren
  tableBody.innerHTML = "";

  // Aktuelles Datum im Format YYYY-MM-DD für den Vergleich
  const today = new Date().toISOString().split("T")[0];

  // Dynamisches Update der Zeit für den heutigen Tag
  function updateTodayTime() {
    chrome.storage.local.get("wastedTime", (res) => {
      const wastedTime = res.wastedTime || {};
      const todayTime = wastedTime[today] || "Zero";

      // Aktualisiere den Eintrag für heute
      wastedTime[today] = todayTime;

      // Tabelle leeren
      tableBody.innerHTML = "";

      // Sortiere die Daten nach Datum (neueste zuerst)
      const sortedDates = Object.keys(wastedTime).sort(
        (a, b) => new Date(b) - new Date(a)
      );

      // Tabelle mit sortierten Daten befüllen
      sortedDates.forEach((date) => {
        const row = document.createElement("tr");

        // Datum formatieren
        const formattedDate =
          date === today
            ? "Today"
            : new Intl.DateTimeFormat("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(date));

        // Erstes Tabellenfeld: Datum
        const dateCell = document.createElement("td");
        dateCell.style.padding = "10px";
        dateCell.textContent = formattedDate;

        // Zweites Tabellenfeld: Zeit
        const timeCell = document.createElement("td");
        timeCell.style.padding = "10px";
        timeCell.textContent = wastedTime[date];

        // Zeile zusammensetzen und hinzufügen
        row.appendChild(dateCell);
        row.appendChild(timeCell);
        tableBody.appendChild(row);
      });
    });
  }

  // Funktion zur Berechnung der gesamten Zeit
  function calculateTotalTime() {
    let totalSeconds = 0;

    // Iteriere über alle gespeicherten Zeiten und summiere sie
    for (const date in wastedTime) {
      const timeString = wastedTime[date];
      const timeParts = timeString.split(":"); // Erwartet Format "HH:MM:SS"

      if (timeParts.length === 3) {
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        const seconds = parseInt(timeParts[2], 10) || 0;

        totalSeconds += hours * 3600 + minutes * 60 + seconds; // Umrechnung in Sekunden
      }
    }

    // Überprüfen, ob totalSeconds null ist
    if (totalSeconds === 0) {
      totalTimeElement.textContent = ""; // Leeren, wenn keine Zeiten vorhanden sind
    } else {
      // Umrechnung der Gesamtzeit in Stunden, Minuten und Sekunden
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      const totalRemainingSeconds = totalSeconds % 60;

      // Formatierung der Gesamtsumme
      const totalTimeFormatted = `${totalHours}h ${totalMinutes}m ${totalRemainingSeconds}s`;

      // Setze den Text des totalTime-Elements
      totalTimeElement.innerHTML =
        "<em>Total Time Consumed so far: </em>" + totalTimeFormatted;
    }
  }

  // Initialer Aufruf und Update alle 1 Sekunde
  updateTodayTime();
  setInterval(updateTodayTime, 1000);

  // Prüfe, ob es überhaupt Daten gibt
  if (Object.keys(wastedTime).length === 0) {
    // Keine Daten, zeige eine Nachricht an
    const noDataMessage = document.createElement("tr");
    const messageCell = document.createElement("td");
    messageCell.colSpan = 2; // Beide Spalten kombinieren
    messageCell.style.padding = "10px";
    messageCell.textContent = "You haven't wasted any time yet"; // Text anzeigen

    noDataMessage.appendChild(messageCell);
    tableBody.appendChild(noDataMessage);
  } else {
    // Sortiere die Daten nach Datum (neueste zuerst)
    const sortedDates = Object.keys(wastedTime).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    // Tabelle mit Daten befüllen
    sortedDates.forEach((date) => {
      const row = document.createElement("tr");

      // Datum im gewünschten Format formatieren
      const formattedDate = new Intl.DateTimeFormat("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(date));

      // Erstes Tabellenfeld: Datum
      const dateCell = document.createElement("td");
      dateCell.style.padding = "10px";
      dateCell.textContent = date === today ? "Today" : formattedDate; // Setze "Today" für das heutige Datum

      // Zweites Tabellenfeld: Zeit
      const timeCell = document.createElement("td");
      timeCell.style.padding = "10px";
      timeCell.textContent = wastedTime[date]; // Zeit als Text einfügen

      // Zeile zusammensetzen und hinzufügen
      row.appendChild(dateCell);
      row.appendChild(timeCell);
      tableBody.appendChild(row);
    });
  }

  // Berechne die gesamte Zeit und aktualisiere das Element
  calculateTotalTime();
});
function performAnalysis() {
  chrome.storage.local.get("wastedTime", (res) => {
    const wastedTime = res.wastedTime || {};
    let totalSeconds = 0;
    let entryCount = 0;

    // Alle Zeiten in Sekunden umrechnen und summieren
    for (const date in wastedTime) {
      const timeString = wastedTime[date];
      const [hours, minutes, seconds] = timeString.split(":").map(Number);
      totalSeconds +=
        (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
      entryCount++;
    }

    // Durchschnitt in Sekunden berechnen
    const averageSeconds = entryCount ? totalSeconds / entryCount : 0;

    // Hochrechnung auf Monat (30 Tage) und Jahr (365 Tage)
    const dailyAverage = averageSeconds; // Durchschnittliche tägliche Verschwendung
    const monthlyAverage = dailyAverage * 30;
    const yearlyAverage = dailyAverage * 365;

    // Funktion zur Formatierung der Zeit
    function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    // Durchschnittliche tägliche Zeit in human-readable format
    const averageFormatted = formatTime(averageSeconds);
    const monthlyFormatted = formatTime(monthlyAverage);
    const yearlyFormatted = formatTime(yearlyAverage);

    // HTML-Element für die Analyse
    const analysisElement = document.querySelector(".analysis");
    analysisElement.innerHTML = `
      <h2>Time Analysis</h2>
      <h4>See how much time you spend consuming content on average and the impact of this behaviour on your future.</h4>
      <p><strong>Average Time Wasted Per Day:</strong> ${averageFormatted}</p>
      <p><strong>Estimated Wasted Time Per Month:</strong> ${monthlyFormatted}</p>
      <p><strong>Estimated Wasted Time Per Year:</strong> ${yearlyFormatted}</p>
      <p><u>Imagine what you could do with that time</u>😲</p>
    `;
  });
}

// Initialer Aufruf zur Analyse
performAnalysis();
