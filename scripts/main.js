import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false });

const HISTORY_KEY = "gdf-history";
const MAX_HISTORY = 8;
const EXAMPLE_USERS = ["abhishekjaiswar221","torvalds", "gaearon", "sindresorhus"];

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Shell: "#89e051",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
};

class GitHubApiError extends Error {
  constructor(type, resetAt = null) {
    super(type);
    this.type = type;
    this.resetAt = resetAt;
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, time: Date.now() });
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function toSafeHttpUrl(url) {
  if (!url) return null;
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch (_) {
    // fall through
  }
  return null;
}

function formatCompact(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0);
}

function formatJoinDate(iso) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(iso));
}

function formatRelativeTime(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secondsInUnit] of units) {
    if (seconds >= secondsInUnit) {
      return rtf.format(-Math.floor(seconds / secondsInUnit), unit);
    }
  }
  return rtf.format(0, "second");
}

function rateLimitResetAt(res) {
  const reset = res.headers.get("x-ratelimit-reset");
  return reset ? new Date(Number(reset) * 1000) : null;
}

async function fetchUser(username) {
  const cacheKey = `user:${username.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if (res.status === 404) throw new GitHubApiError("not-found");
  if (res.status === 403) throw new GitHubApiError("rate-limit", rateLimitResetAt(res));
  if (!res.ok) throw new GitHubApiError("request-failed");

  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

async function fetchTopRepos(username) {
  const cacheKey = `repos:${username.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
  );
  if (!res.ok) return [];
  const repos = await res.json();
  if (!Array.isArray(repos)) return [];

  const topRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);
  setCached(cacheKey, topRepos);
  return topRepos;
}

function getHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (_) {
    return [];
  }
}

function addToHistory(login) {
  const history = getHistory().filter((entry) => entry.toLowerCase() !== login.toLowerCase());
  history.unshift(login);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function metaItem(icon, text) {
  return `<span class="profile-meta-item"><i class="bi bi-${icon}"></i>${text}</span>`;
}

function statTile(icon, value, label) {
  return `
    <div class="stat-tile">
      <i class="bi bi-${icon}"></i>
      <div class="stat-value">${formatCompact(value)}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function profileCardHtml(user) {
  const blogUrl = toSafeHttpUrl(user.blog);
  const twitterUrl = user.twitter_username ? `https://x.com/${encodeURIComponent(user.twitter_username)}` : null;

  const metaParts = [
    user.location ? metaItem("geo-alt-fill", escapeHtml(user.location)) : "",
    user.company ? metaItem("building", escapeHtml(user.company)) : "",
    blogUrl
      ? `<a class="profile-meta-item" href="${blogUrl}" target="_blank" rel="noopener"><i class="bi bi-link-45deg"></i>${escapeHtml(user.blog)}</a>`
      : "",
    metaItem("calendar3", `Joined ${formatJoinDate(user.created_at)}`),
  ].join("");

  return `
    <div class="profile-main">
      <img class="profile-avatar" src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.login)}'s avatar" loading="lazy">
      <div class="profile-info">
        <div class="profile-name-row">
          <h2 class="profile-name">${escapeHtml(user.name || user.login)}</h2>
          ${user.hireable ? '<span class="badge badge-hireable"><i class="bi bi-briefcase-fill"></i> Open to work</span>' : ""}
        </div>
        <a class="profile-login" href="${escapeHtml(user.html_url)}" target="_blank" rel="noopener">@${escapeHtml(user.login)}</a>
        ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ""}
        <div class="profile-meta">${metaParts}</div>
      </div>
    </div>

    <div class="profile-stats">
      ${statTile("people-fill", user.followers, "Followers")}
      ${statTile("person-plus-fill", user.following, "Following")}
      ${statTile("journal-code", user.public_repos, "Repos")}
      ${statTile("collection-fill", user.public_gists, "Gists")}
    </div>

    <div class="profile-actions">
      <a class="btn-primary" href="${escapeHtml(user.html_url)}" target="_blank" rel="noopener">
        <i class="bi bi-box-arrow-up-right"></i> View on GitHub
      </a>
      <button type="button" class="btn-secondary" id="copy-link-btn" data-url="${escapeHtml(user.html_url)}">
        <i class="bi bi-clipboard"></i> Copy link
      </button>
      ${user.email ? `<a class="btn-icon" href="mailto:${escapeHtml(user.email)}" title="Email"><i class="bi bi-envelope-fill"></i></a>` : ""}
      ${twitterUrl ? `<a class="btn-icon" href="${twitterUrl}" target="_blank" rel="noopener" title="Twitter / X"><i class="bi bi-twitter"></i></a>` : ""}
      <a class="btn-icon" href="${escapeHtml(user.url)}" target="_blank" rel="noopener" title="Raw JSON"><i class="bi bi-braces"></i></a>
    </div>
  `;
}

function repoCardHtml(repo) {
  const color = LANGUAGE_COLORS[repo.language] || "#8b949e";
  return `
    <a class="repo-card" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener">
      <div class="repo-card-header">
        <i class="bi bi-journal-code"></i>
        <span class="repo-name">${escapeHtml(repo.name)}</span>
      </div>
      <p class="repo-desc">${repo.description ? escapeHtml(repo.description) : "No description provided."}</p>
      <div class="repo-meta">
        ${repo.language ? `<span class="repo-lang"><span class="lang-dot" style="background:${color}"></span>${escapeHtml(repo.language)}</span>` : ""}
        <span class="repo-stat"><i class="bi bi-star-fill"></i>${formatCompact(repo.stargazers_count)}</span>
        <span class="repo-stat"><i class="bi bi-diagram-2-fill"></i>${formatCompact(repo.forks_count)}</span>
      </div>
      <div class="repo-updated"><i class="bi bi-clock-history"></i>Updated ${formatRelativeTime(repo.updated_at)}</div>
    </a>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  const usernameInput = document.getElementById("username");

  const quickChips = document.getElementById("quick-chips");
  const historyRow = document.getElementById("history-row");
  const historyChips = document.getElementById("history-chips");
  const clearHistoryBtn = document.getElementById("clear-history");

  const states = {
    empty: document.getElementById("state-empty"),
    loading: document.getElementById("state-loading"),
    error: document.getElementById("state-error"),
    result: document.getElementById("state-result"),
  };

  const errorIcon = document.getElementById("error-icon");
  const errorTitle = document.getElementById("error-title");
  const errorText = document.getElementById("error-text");
  const retryBtn = document.getElementById("retry-btn");

  const profileCard = document.getElementById("profile-card");
  const reposGrid = document.getElementById("repos-grid");
  const reposCount = document.getElementById("repos-count");

  let lastQuery = "";

  function setState(name) {
    for (const key of Object.keys(states)) {
      states[key].hidden = key !== name;
    }
  }

  function renderQuickChips() {
    quickChips.innerHTML = EXAMPLE_USERS.map(
      (name) => `<button type="button" class="chip" data-username="${escapeHtml(name)}">${escapeHtml(name)}</button>`,
    ).join("");
  }

  function renderHistory() {
    const history = getHistory();
    historyRow.hidden = history.length === 0;
    historyChips.innerHTML = history
      .map((name) => `<button type="button" class="chip" data-username="${escapeHtml(name)}">${escapeHtml(name)}</button>`)
      .join("");
  }

  function renderRepos(repos) {
    reposCount.textContent = repos.length ? `${repos.length} shown` : "";
    reposGrid.innerHTML = repos.length
      ? repos.map(repoCardHtml).join("")
      : `<p class="repos-empty">No public repositories to show.</p>`;
  }

  function renderProfile(user) {
    profileCard.innerHTML = profileCardHtml(user);
    const copyBtn = document.getElementById("copy-link-btn");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.url);
        const label = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="bi bi-clipboard-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = label;
        }, 1500);
      } catch (_) {
        // clipboard not available; ignore
      }
    });
  }

  function showError(type, resetAt) {
    const rateLimitText = resetAt
      ? `GitHub's API rate limit was exceeded. It resets at ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(resetAt)}.`
      : "GitHub's API rate limit was exceeded. Please try again in a few minutes.";

    const config = {
      "not-found": {
        icon: "bi-emoji-frown",
        title: "User not found",
        text: `We couldn't find a GitHub user named "${lastQuery}".`,
      },
      "rate-limit": {
        icon: "bi-hourglass-split",
        title: "Rate limit reached",
        text: rateLimitText,
      },
      "request-failed": {
        icon: "bi-wifi-off",
        title: "Something went wrong",
        text: "Check your connection and try again.",
      },
    };
    const c = config[type] || config["request-failed"];
    errorIcon.className = `bi ${c.icon} state-icon`;
    errorTitle.textContent = c.title;
    errorText.textContent = c.text;
  }

  async function runSearch(username) {
    lastQuery = username;
    usernameInput.value = username;
    setState("loading");
    NProgress.start();
    try {
      const [user, repos] = await Promise.all([fetchUser(username), fetchTopRepos(username)]);
      renderProfile(user);
      renderRepos(repos);
      setState("result");
      addToHistory(user.login);
      renderHistory();
    } catch (err) {
      if (err instanceof GitHubApiError) {
        showError(err.type, err.resetAt);
      } else {
        showError("request-failed");
      }
      setState("error");
    } finally {
      NProgress.done();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = usernameInput.value.trim();
    if (value) runSearch(value);
  });

  quickChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) runSearch(chip.dataset.username);
  });

  historyChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) runSearch(chip.dataset.username);
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  retryBtn.addEventListener("click", () => {
    if (lastQuery) runSearch(lastQuery);
  });

  renderQuickChips();
  renderHistory();
});
