'use strict';

// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");



/**
 * theme (light / dark)
 * the <head> script already applied the saved or system theme before first paint
 */

const themeBtn = document.querySelector("[data-theme-btn]");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

const applyTheme = function (theme) {
  root.dataset.theme = theme;
  themeMeta.setAttribute("content", theme === "light" ? "#eef1f9" : "#0b0d16");
  themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
}

applyTheme(root.dataset.theme);

themeBtn.addEventListener("click", function () {

  const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
  try { localStorage.setItem("theme", nextTheme); } catch (e) { }

  if (!document.startViewTransition || reduceMotion.matches) {
    applyTheme(nextTheme);
    return;
  }

  // reveal the new theme in a circle that grows out of the button
  const rect = this.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  document.startViewTransition(function () { applyTheme(nextTheme); }).ready.then(function () {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });

});

// keep following the system setting until the visitor picks a theme themselves
prefersLight.addEventListener("change", function (event) {
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("theme"); } catch (e) { }
  if (!savedTheme) applyTheme(event.matches ? "light" : "dark");
});



/**
 * profile header
 */

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// contact info toggle functionality for mobile
sidebarBtn.addEventListener("click", function () {
  elementToggleFunc(sidebar);
  this.setAttribute("aria-expanded", sidebar.classList.contains("active"));
});

// profile stats count what is actually on the page, so they never go stale
const statSources = {
  projects: "[data-page='projects'] [data-filter-item]",
  skills: ".skill [data-filter-item]",
  certificates: ".clients-item"
};

const statValues = document.querySelectorAll("[data-stat]");

for (let i = 0; i < statValues.length; i++) {
  const count = document.querySelectorAll(statSources[statValues[i].dataset.stat]).length;
  statValues[i].value = count;
  statValues[i].textContent = count;
}



/**
 * filters (skills and projects each get their own independent filter)
 */

const filterSections = document.querySelectorAll("section.projects");

for (let s = 0; s < filterSections.length; s++) {

  const section = filterSections[s];
  const filterBtn = section.querySelectorAll("[data-filter-btn]");
  const filterItems = section.querySelectorAll("[data-filter-item]");

  const filterFunc = function (selectedValue) {

    for (let i = 0; i < filterItems.length; i++) {

      if (selectedValue === "all") {
        filterItems[i].classList.add("active");
      } else if (selectedValue === filterItems[i].dataset.category) {
        filterItems[i].classList.add("active");
      } else {
        filterItems[i].classList.remove("active");
      }

    }

  }

  let lastClickedBtn = filterBtn[0];

  for (let i = 0; i < filterBtn.length; i++) {

    filterBtn[i].addEventListener("click", function () {

      filterFunc(this.innerText.toLowerCase());

      lastClickedBtn.classList.remove("active");
      this.classList.add("active");
      lastClickedBtn = this;

      // keep the chosen chip in view when the chip row scrolls sideways
      this.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "nearest", inline: "nearest" });

    });

  }

}



/**
 * contact form
 */

// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



/**
 * page navigation
 */

// page navigation variables
const navbar = document.querySelector("[data-navbar]");
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const navIndicator = document.querySelector("[data-nav-indicator]");
const pages = document.querySelectorAll("[data-page]");
const mainContent = document.querySelector(".main-content");
const gotoLinks = document.querySelectorAll("[data-goto]");

// slide the glass "lens" under the active tab
const moveNavIndicator = function () {
  const activeLink = navbar.querySelector("[data-nav-link].active");
  if (!activeLink) return;

  navIndicator.style.width = activeLink.offsetWidth + "px";
  navIndicator.style.height = activeLink.offsetHeight + "px";
  navIndicator.style.transform = `translate(${activeLink.offsetLeft}px, ${activeLink.offsetTop}px)`;
}

const showPage = function (pageName) {

  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.toggle("active", pages[i].dataset.page === pageName);
  }

  for (let i = 0; i < navigationLinks.length; i++) {
    const isActive = navigationLinks[i].dataset.navLink === pageName;
    navigationLinks[i].classList.toggle("active", isActive);

    if (isActive) {
      navigationLinks[i].setAttribute("aria-current", "page");
    } else {
      navigationLinks[i].removeAttribute("aria-current");
    }
  }

  moveNavIndicator();

}

// like switching tabs on a profile: only scroll back up if the page content is above the screen
const revealContent = function () {
  if (mainContent.getBoundingClientRect().top < 0) mainContent.scrollIntoView();
}

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    showPage(this.dataset.navLink);
    revealContent();
  });
}

// buttons and highlights elsewhere that open a page (and optionally a section on it)
for (let i = 0; i < gotoLinks.length; i++) {
  gotoLinks[i].addEventListener("click", function (event) {

    event.preventDefault();
    showPage(this.dataset.goto);

    const hash = this.getAttribute("href");
    const target = hash && hash.charAt(0) === "#" ? document.querySelector(hash) : mainContent;

    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    });

  });
}

// tab widths change when fonts and icons load or the layout switches breakpoints
new ResizeObserver(moveNavIndicator).observe(navbar);
moveNavIndicator();



/**
 * liquid glass refraction
 * Chromium can run an SVG displacement filter inside backdrop-filter, which bends whatever
 * scrolls behind the bars around their edges. Other browsers keep the plain frosted blur.
 */

const canRefract = !!(navigator.userAgentData &&
  navigator.userAgentData.brands.some(function (b) { return b.brand === "Chromium"; }));

// displacement map for a rounded rectangle: neutral grey in the middle, and toward the edges
// red/green push the backdrop inward like light bending through the rim of a glass lens
const lensMap = function (width, height, radius, bezel) {

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);
  const data = image.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {

      // signed distance from this pixel to the rounded-rect edge (positive = inside)
      const px = x + 0.5 - width / 2;
      const py = y + 0.5 - height / 2;
      const qx = Math.abs(px) - (width / 2 - radius);
      const qy = Math.abs(py) - (height / 2 - radius);
      const depth = radius - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0);

      let dx = 0;
      let dy = 0;

      if (depth < bezel) {
        // direction of the nearest edge
        let nx = 0;
        let ny = 0;

        if (qx > 0 && qy > 0) {
          const length = Math.hypot(qx, qy);
          nx = qx / length;
          ny = qy / length;
        } else if (qx > qy) {
          nx = 1;
        } else {
          ny = 1;
        }

        const strength = Math.pow(1 - Math.max(depth, 0) / bezel, 2);
        dx = -nx * Math.sign(px) * strength;
        dy = -ny * Math.sign(py) * strength;
      }

      const i = (y * width + x) * 4;
      data[i] = 128 + dx * 127;
      data[i + 1] = 128 + dy * 127;
      data[i + 2] = 128;
      data[i + 3] = 255;

    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();

}

if (canRefract) {

  root.classList.add("has-refraction");

  const lenses = [
    { el: navbar, filter: "lg-navbar", bezel: 22 },
    { el: document.querySelector("[data-appbar]"), filter: "lg-appbar", bezel: 16 }
  ];

  const updateLens = function (lens) {
    const width = Math.round(lens.el.offsetWidth);
    const height = Math.round(lens.el.offsetHeight);
    if (!width || !height || (width === lens.width && height === lens.height)) return;

    lens.width = width;
    lens.height = height;

    const radius = Math.min(parseFloat(getComputedStyle(lens.el).borderTopLeftRadius) || 0, width / 2, height / 2);
    const mapImage = document.querySelector(`#${lens.filter} feImage`);

    mapImage.setAttribute("width", width);
    mapImage.setAttribute("height", height);
    mapImage.setAttribute("href", lensMap(width, height, radius, Math.min(lens.bezel, height / 2)));
  }

  const lensObserver = new ResizeObserver(function () {
    for (let i = 0; i < lenses.length; i++) updateLens(lenses[i]);
  });

  for (let i = 0; i < lenses.length; i++) lensObserver.observe(lenses[i].el);

}
