// Funktion, um beim Zuschauen eines Videos innerhalb einer Playlist alle Vorschläge ausblenden nur Playlist soll noch angezeigt werden
function keepPlaylistAlive(userChannelName) {
    const playlists = document.querySelectorAll(
      "#secondary #items ytd-playlist-panel-renderer"
    );
    playlists.forEach((playlist) => {
      const playlistOwner = playlist.querySelector(
        "a.yt-simple-endpoint.style-scope.yt-formatted-string"
      );
      playlist.style.display =
        playlistOwner && playlistOwner.textContent !== userChannelName
          ? "none"
          : "block";
    });
  }