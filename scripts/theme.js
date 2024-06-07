"use strict";
let theme = document.getElementById("theme-slider");
theme.addEventListener("click", (evt) => {
  let themeMode = document.body;
  themeMode.classList.toggle("switch-theme");
});
