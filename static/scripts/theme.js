// Calculate current theme setting
function getCurrTheme(localStorageTheme, systemSettingDark) {
    if (localStorageTheme !== null) {
        return localStorageTheme;
    }
    if (systemSettingDark.matches) {
        return "dark";
    }
    return "light";
}

// Update html theme
function updateThemeOnHtmlEl(theme) {
    document.querySelector("html").setAttribute("data-theme", theme);
}

const button = document.getElementById("theme-toggle");
const localStorageTheme = localStorage.getItem("theme");
const systemSettingDark = window.matchMedia("(prefers-color-scheme: light)");
let currentThemeSetting = getCurrTheme(localStorageTheme, systemSettingDark);

updateThemeOnHtmlEl(currentThemeSetting);

// Theme toggle button
button.addEventListener("click", (event) => {
    const newTheme = currentThemeSetting === "dark" ? "light" : "dark";

    localStorage.setItem("theme", newTheme);
    updateThemeOnHtmlEl(newTheme);

    currentThemeSetting = newTheme;
});