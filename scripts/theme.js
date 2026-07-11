"use strict";
(function () {
  var input = document.getElementById("theme-toggle-input");
  var current = document.documentElement.getAttribute("data-theme") || "light";
  input.checked = current === "dark";

  input.addEventListener("change", function () {
    var next = input.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("gdf-theme", next);
  });
})();
