<!-- PROJECT LOGO -->

[link-chrome]: https://chromewebstore.google.com/detail/youtube-time-manager/ikhkekdjdjpklbpmgloalpapjgfolheh "Chrome Web Store"
[link-firefox]: https://addons.mozilla.org/en-US/firefox/addon/youtube-time-manager "Firefox Addons"

<br />
<p align="center">
  <a href="github.com/Olivier_Luethy/TackPad.git">
    <img src="icon/icon.png" alt="Logo" width="200" height="200">
  </a>

  <h3 align="center">YouTube Time Manager</h3>
  <h4 align="center">Google Chrome extension to block YouTube's distractive feature - Decide what you want to see</h4>

  <p align="center">
    Here I'll explain how I developed the application called YouTube Time Manager
    <br />
    <a href="github.com/olivierluethy/YouTube Time Manager/blob/master/README.md"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/olivierluethy/YouTube Time Manager/">View Demo</a>
    ·
    <a href="https://github.com/olivierluethy/YouTube Time Manager/issues">Report Bug</a>
    ·
    <a href="https://github.com/olivierluethy/YouTube Time Manager/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#features">Features</a>
    </li>
    <li>
      <a href="#how-it-works">How It Works</a>
    </li>
    <li>
      <a href="#installation">Installation</a>
    </li>
    <li>
      <a href="#usage">Usage</a>
    </li>
    <li>
      <a href="#license">License</a>
    </li>
    <li>
      <a href="#author">Author</a>
    </li>
  </ol>
</details>

YouTube Time Manager is a simple yet effective Chrome extension that improves your focus by hiding YouTube recommendations, other users' playlists, and the tab list while you're watching videos. This ensures that you're not distracted by unrelated content and can focus on what's important.

---

### ✨ **Key Features** ✨  

- 🎯 **Goal-Driven Feed Customization**  
  Define your goals, and YouTube Time Manager will tailor your feed accordingly, ensuring that you only see videos that match your objectives.

- 🏠 **Declutter Your Home Page**  
  Remove the noise from your YouTube homepage by clearing out recommendations and updates. Enjoy a clean, distraction-free interface that promotes focus.

- 🔍 **Eliminate the Discovery Section**  
  Avoid distractions from trending content. YouTube Time Manager removes the discovery section, keeping your focus on what truly matters.

- 🔔 **Flexible Subscription Controls**  
  Choose whether to display videos from your subscriptions. With an easy toggle in the extension’s popup, you decide what’s visible.

- 🛡️ **Smart Redirect for Manual Bypasses**  
  Trying to access the trending section via URL? YouTube Time Manager will redirect you to your subscriptions, keeping your experience distraction-free.

- 🎥 **Playlist Visibility with Recommendation Blocking**  
  Unlike other extensions, YouTube Time Manager allows playlist navigation while hiding unrelated video suggestions. This ensures uninterrupted learning or entertainment.

- ⏳ **Overconsumption Timeout**  
  Watch five videos that don’t align with your goals, and YouTube access will be blocked for 10 minutes. During this period, you’ll receive insights about time wasted, helping you make better decisions for the future.

---


### 🌟 **Why Choose YouTube Time Manager?** 🌟  

YouTube Time Manager is crafted for individuals seeking a productive YouTube experience. Unlike similar extensions, it blocks distractions effectively without introducing toggles that could undo the effort. Designed through practical experience, this extension empowers you to stay on track and use your time wisely.  

---

### 🤝 **Support & Feedback** 🤝  

Your input matters! Encountering issues or have suggestions? Let’s improve together:  
📧 **Contact Us:** muskox.beryl2671@eagereverest.com  

---

### 🛠 **Note:**  🛠

YouTube Time Manager is ideal for users committed to enhancing their productivity. By minimizing distractions and promoting goal-oriented content consumption, this extension ensures you make the most out of your YouTube time.  

---  

### 👇 **Official download links** 👇

<div align="center">

[<img src="https://user-images.githubusercontent.com/574142/232173820-eea32262-2b0f-4ec6-8a38-b1c872981d75.png" height="67" alt="Chrome" valign="middle">][link-chrome]
[<img src="https://user-images.githubusercontent.com/574142/232173822-af2e660f-11df-4d6c-a71b-0e92e9be543f.png" height="67" alt="Firefox" valign="middle">][link-firefox]
We are planing to add the extension also to the firefox, so even mobile users who have firefox installed will be able to use it from their phone.

</div>

## ? **How It Works** ?

### Background Process

The extension works by inserting a content script into YouTube pages. This script manipulates the DOM to hide certain elements, including recommendations, external playlists, and the tab list. The extension's state (enabled/disabled) is stored in Chrome's sync cache, allowing it to persist across browser sessions and devices.

### User Interface

The user interface consists of a simple popup with a toggle switch:

- **Toggle Switch:** Allows the user to enable or disable the hiding of YouTube subscription videos. The state of the switch is synchronized with the state stored in the Chrome cache.
- **Text Indicator:** Displays "Toggle On" or "Toggle Off" depending on the current state of the extension.

### Content Script

The content script (`content.js`) handles all the DOM manipulation:

- **hideYouTubeRecommendations:** This function hides YouTube recommendations, external playlists, and the tab list.
- **hideElement:** This function handles the general selectors which distract for example Trends Tab or Home Tab.
- **hideElements:** This function hides all elements inside a specific selector
- **keepPlaylistAlive:** While watching a video block all video recommendations but keep the playlist alive if the video currently watched is inside of a playlist
- **hideYouTubeRecommendations:** Responsible for running all the disability by using **hideElements** and **keepPlaylistAlive** function
- **redirectToSubscriptions:** After entering YouTube it will redirect you to the subscription feed
- **cheatingRedirect:** People tend to bypass blockings to be still able to see distractions. It blocks access to all feeds related to the **trending** field
- **observeDOMForRecommendations:** Observe DOM-Chases after the page has fully loaded
- **toggleFeed:** Is responsible for handling changes based on the activated toggle inside the popup and uses the **toggleFeed** function itself running
- **observeDOMForFeed:** Observes the activity inside the feed and then uses **toggleFeed** function to do further things

The content script (`popup.js`) handles all the DOM for the popup:

- **updateToggleText:** Updates the text illustrating the current state of the toggle

## Installation

1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle in the top right corner.
4. Click on "Load unpacked" and select the folder where you cloned/downloaded the extension.
5. The extension should now appear in your list of extensions and is ready to use.

## Usage

1. Click on the extension icon in the Chrome toolbar.
2. Use the toggle switch to enable or disable the hiding of YouTube subscription videos.
3. The state of the extension (enabled or disabled) will be remembered for future browsing sessions.

## Feature request

Originally I had planned to add a slider to the extension so you could turn it on and off as needed. But if you decide to download the extension and want to solve the problem it solves, why would you want to disable it? Why should you download this extension in the first place? For one thing, it would be technically nice to have the design, but it's also unnecessary. If someone else wants to add something, go ahead. Create a bug and I will be informed and can add the feature if it really makes sense.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

- **Olivier Lüthy** - _Developer and Maintainer_

## Name change history

- YouRecoHide (First Name)
- YouTube-Disblock (Second name lasted till 20. December 2024)
- YouTube Time Manager (Lasted till then)

## Links
Links that I've used to accomplish this extension:<br>
Used for the two sliders when no goals and directly under header
- https://codepen.io/optimisticweb/pen/oNOBwBq<br>
How to create a modal popup
- https://www.w3schools.com/howto/howto_css_modals.asp<br>
Only bottom box-shadow property used for header
- https://stackoverflow.com/questions/4561097/css-box-shadow-bottom-only<br>
For the modal animation forth and back
- https://stackoverflow.com/questions/76708361/how-do-i-css-transition-a-modal-dialog-element-when-it-opens<br>
- https://codepen.io/Olibaba02/pen/EaYpJmJ

## Acknowledgements

- Special thanks to the Chrome Extensions documentation and various online resources for guidance in developing this extension.

## Disclaimer

I don't store any of your information. If you don't believe me, all the code is in this repo so you can check it out for yourself. The only data that is stored is on your own computer. This is necessary for Chrome to remember what you chose to hide when you refresh your page.
YouTube Time Manager for YouTube is not affiliated with YouTube.
