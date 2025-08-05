// MonoHub Lookup - Minimal GitHub Profile Finder
// Main script for fetching and displaying GitHub user data and repositories

// DOM element references
let searchBtn = document.querySelector(".search");
let usernameinp = document.querySelector(".usernameinp");
let card = document.querySelector(".card");
let reposList = document.querySelector(".repos-list");
let loadingIndicator = document.querySelector(".loading-indicator");
let errorMessage = document.querySelector(".error-message");
let showMoreBtn = document.querySelector(".show-more");

let contribImg = document.querySelector(".contribution-img");
let contribDiv = document.querySelector(".contributions");

// State variables
let currentUsername = null;
let currentPage = 1;
let perPage = 5;
let totalRepos = 0;

// Show or hide loading spinner
function setLoading(isLoading) {
  loadingIndicator.classList.toggle("hidden", !isLoading);
}

// Fade utilities
function showFadeIn(el) {
  el.classList.remove("opacity-0");
  el.classList.add("opacity-100");
}
function hideFadeOut(el) {
  el.classList.remove("opacity-100");
  el.classList.add("opacity-0");
}

// Show or hide error message
function setError(msg) {
  errorMessage.textContent = msg || "";
  if (msg) {
    showFadeIn(errorMessage);
  } else {
    hideFadeOut(errorMessage);
  }
}

// Reset all UI areas
function clearUI() {
  card.innerHTML = "";
  reposList.innerHTML = "";
  setError("");
  card.classList.add("opacity-0");
  reposList.classList.add("opacity-0");
  contribDiv.classList.add("opacity-0");
  contribImg.src = "";
}

// Fetch GitHub user profile data
function getProfileData(username) {
  return fetch(`https://api.github.com/users/${username}`).then((raw) => {
    if (!raw.ok) throw new Error("User not found.");
    return raw.json();
  });
}

// Fetch GitHub repositories (paginated)
function getRepos(username, page = 1, perPage = 5) {
  return fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`
  ).then((raw) => {
    if (!raw.ok) throw new Error("Failed to fetch repos...");
    return raw.json();
  });
}

// Render profile data
function decorateProfileData(details) {
  let data = `<div class="flex items-center gap-4 mb-2">
    <img src="${
      details.avatar_url
    }" alt="User Avatar" class="w-16 h-16 rounded-full" />
    <div>
      <div class="font-semibold text-lg">${details.name || details.login}</div>
      <div class="text-gray-500 text-sm">@${details.login}</div>
    </div>
  </div>
  <div class="mt-2">
    <table class="w-full text-sm">
      <tbody>
        <tr><td class="pr-2 text-gray-500">Bio</td><td>${
          details.bio || "-"
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Repos</td><td>${
          details.public_repos
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Followers</td><td>${
          details.followers
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Following</td><td>${
          details.following
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Location</td><td>${
          details.location || "-"
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Company</td><td>${
          details.company || "-"
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Blog</td><td>${
          details.blog
            ? `<a href='${details.blog}' class='underline' target='_blank'>${details.blog}</a>`
            : "-"
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Email</td><td>${
          details.email || "-"
        }</td></tr>
        <tr><td class="pr-2 text-gray-500">Joined</td><td>${new Date(
          details.created_at
        ).toLocaleDateString()}</td></tr>
      </tbody>
    </table>
  </div>`;
  card.innerHTML = data;
  showFadeIn(card);
}

// Render repositories
function decorateRepos(repos, append = false) {
  if (!repos.length && !append) {
    reposList.innerHTML =
      '<div class="text-gray-400 text-center text-sm">No public repositories found.</div>';
    showMoreBtn.classList.add("hidden");
    return;
  }

  let html = append
    ? reposList.innerHTML
    : `<div class='font-semibold mb-1 text-base'>Repositories</div><ul class='space-y-1'>`;

  html += repos
    .map(
      (repo) => `
      <li class="flex flex-col sm:flex-row sm:items-center justify-between py-1">
        <div>
          <a href="${
            repo.html_url
          }" target="_blank" class="text-black underline font-medium">${
        repo.name
      }</a>
          <span class="text-xs text-gray-400 ml-2">${
            repo.private ? "Private" : "Public"
          }</span>
          <div class="text-xs text-gray-500">${
            repo.description || "No description."
          }</div>
        </div>
        <div class="flex gap-2 mt-1 sm:mt-0 text-xs text-gray-500">
          <span>⭐ ${repo.stargazers_count}</span>
          <span>🍴 ${repo.forks_count}</span>
        </div>
      </li>`
    )
    .join("");

  if (!append) html += `</ul>`;
  reposList.innerHTML = html;
  showFadeIn(reposList);
}

// Handle search
function handleSearch() {
  let username = usernameinp.value.trim();
  clearUI();
  if (username.length > 0) {
    setLoading(true);
    getProfileData(username)
      .then((data) => {
        decorateProfileData(data);
        currentUsername = username;
        currentPage = 1;
        totalRepos = data.public_repos;

        // Load heatmap
        contribImg.src = `https://ghchart.rshah.org/${data.login}`;
        contribImg.onerror = () => {
          contribDiv.classList.add("hidden");
        };
        contribImg.onload = () => {
          contribDiv.classList.remove("hidden");
          showFadeIn(contribDiv);
        };

        return getRepos(username, currentPage, perPage);
      })
      .then((repos) => {
        decorateRepos(repos);
        setLoading(false);
        if (totalRepos > perPage) {
          showMoreBtn.classList.remove("hidden");
        } else {
          showMoreBtn.classList.add("hidden");
        }
      })
      .catch((err) => {
        setError(err.message || "An error occurred.");
        setLoading(false);
        showMoreBtn.classList.add("hidden");
      });
  } else {
    setError("Please enter a GitHub username.");
    showMoreBtn.classList.add("hidden");
  }
}

// Event: Search button
searchBtn.addEventListener("click", handleSearch);

// Event: Press Enter to search
usernameinp.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    handleSearch();
  }
});

// Event: Autofocus on page load
window.addEventListener("DOMContentLoaded", function () {
  usernameinp.focus();
});

// Event: Show more repositories
showMoreBtn.addEventListener("click", function () {
  if (!currentUsername) return;
  setLoading(true);
  getRepos(currentUsername, ++currentPage, perPage)
    .then((repos) => {
      decorateRepos(repos, true);
      setLoading(false);
      if (currentPage * perPage >= totalRepos || repos.length < perPage) {
        showMoreBtn.classList.add("hidden");
      }
    })
    .catch((err) => {
      setError(err.message || "An error occurred.");
      setLoading(false);
      showMoreBtn.classList.add("hidden");
    });
});
