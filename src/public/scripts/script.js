// imports
import { formatNumber, formatDate } from "./formatter.js";

// format dates and numbers
const allDates = document.querySelectorAll("[data-date]");
allDates.forEach((el) => {
    const formatted = formatDate(el.dataset.date, "dd mm, yy tt");
    el.innerText = formatted;
});

const allNumbers = document.querySelectorAll("[data-number]");
allNumbers.forEach((el) => {
    const formatted = formatNumber(el.dataset.number, true);
    el.innerText = formatted;
});
