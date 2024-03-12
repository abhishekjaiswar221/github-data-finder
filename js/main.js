let form = document.querySelector(".form-control");
let username = document.querySelector("#username");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let value = username.value;
  fetchGitData(value).then(() => console.log("Data Fetched"));
});

async function fetchGitData(username) {
  try {
    let data = await window.fetch(`https://api.github.com/users/${username}`);
    console.log(data);
    console.log((data.type));
    let finalData = await data.json();
    let mainRight = document.getElementById("main-right");
    let {
      avatar_url,
      name,
      login,
      bio,
      company,
      blog,
      followers,
      following,
      created_at,
      updated_at,
      public_repos,
      public_gists,
      hireable,
      location,
      email,
      twitter_username,
      url,
      html_url,
    } = finalData;
    mainRight.innerHTML = `
       <div id="profile-photo">
          <picture>
            <img src=${avatar_url} alt="Profile Photo">
          </picture>
        </div>

        <div id="personal-data">
          <h1 id="name" class="space">${name}</h1>
          <h1 id="follow"><span id="followers" class="space">${followers}</span><span id="following" class="space">${following}</span></h1>
          <h3 id="username" class="space">${login}</h3>
          <h3 id="account"><span id="created-at" class="space">${created_at.slice(
      0,
      10
    )}</span> <span id="updated-at" class="space">${updated_at.slice(
      0,
      10
    )}</span></h3>
          <h3 id="email" class="space">${email}</h3>
          <h3 id="bio" class="space">${bio}<span id="repo" class="space public">${public_repos}</span> <span id="gist" class="space public">${public_gists}</span></h3>
          <h3 id="location" class="space">${location}</h3>
          <h3 id="company" class="space">${company}</h3>
          <h3 id="hireable" class="space">${hireable}</h3>
        </div>

        <div id="social-handel">
          <div class="social">
            <a href=${blog} id="blog-site" target="_blank">
              <button>Blog Site</button>
            </a>
            <a href=${url} id="json-data" target="_blank">
              <button>JSON Data</button>
            </a>
          </div>

          <div class="social">
            <a href=${twitter_username} id="twitter-account" target="_blank">
              <button><i class="bi bi-twitter"></i></button>
            </a>
            <a href=${html_url} id="github-account" target="_blank">
              <button><i class="bi bi-github"></i></button>
            </a>
          </div>
        </div>
      `;
  } catch (error) {
    console.log(error);
  }
}
