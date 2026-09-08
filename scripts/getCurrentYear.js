// Hole das HTML-Element, in das das Jahr eingefügt werden soll
const yearElement = document.getElementById("nameYear");

// Erstelle ein neues Datumsobjekt und extrahiere das Jahr
const currentYear = new Date().getFullYear();

// Setze den Textinhalt des Elements auf das aktuelle Jahr
yearElement.textContent = `© ${currentYear}, by Olivier Lüthy`;
