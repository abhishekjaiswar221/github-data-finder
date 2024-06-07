import NProgress from "nprogress";
import "nprogress/nprogress.css";

//Disable the NProgress spinner
NProgress.configure({ showSpinner: false });
//Start the progress bar
NProgress.start();
//Set the progress bar to 50%
NProgress.set(0.5);

document.addEventListener("DOMContentLoaded", () => {
  // Set the progress bar to 80%
  NProgress.set(0.8);
  setTimeout(() => {
    let form = document.querySelector(".form-control");
    let username = document.querySelector("#username");
    const emptyInput = document.querySelector("#username");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let value = username.value;
      fetchGitData(value).then(() => console.log("Data Fetched"));
      emptyInput.value = "";
    });

    //API Call
    async function fetchGitData(username) {
      try {
        let data = await window.fetch(
          `https://api.github.com/users/${username}`,
        );
        console.log(data);
        console.log(data.type);
        let finalData = await data.json();
        console.log(finalData);
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
            10,
          )}</span> <span id="updated-at" class="space">${updated_at.slice(
            0,
            10,
          )}</span></h3>
          <h3 id="email" class="space">${email}</h3>
          <h3 id="bio" class="space">${bio}<span id="repo" class="space public">${public_repos}</span> <span id="gist" class="space public">${public_gists}</span></h3>
          <h3 id="location" class="space">${location}</h3>
          <h3 id="company" class="space">${company}</h3>
          <h3 id="hireable" class="space">${hireable}</h3>
        </div>

        <div id="social-handel">
          <div class="social">
            <a href="http://${blog}" id="blog-site" target="_blank">
              <button class="cursor-type">Blog Site</button>
            </a>
            <a class="cursor-type" href=${url} id="json-data" target="_blank">
              <button class="cursor-type">JSON Data</button>
            </a>
          </div>

          <div class="social">
            <a href="http://x.com/${twitter_username}" id="twitter-account" target="_blank">
              <button class="cursor-type"><i class="bi bi-twitter"></i></button>
            </a>
            <a href=${html_url} id="github-account" target="_blank">
              <button class="cursor-type"><i class="bi bi-github"></i></button>
            </a>
          </div>
        </div>
      `;
      } catch (error) {
        console.log(error);
      }
    }
  }, 2000);
  //Set the progress bar to 90%
  NProgress.set(0.9);
  //Stop the progress bar
  NProgress.done();
});
