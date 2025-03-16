// selectors
const confirmationPopup = document.querySelector(".confirmation-popup");
const confirmationContent = confirmationPopup.querySelector(".content");
const confirmBtn = confirmationPopup.querySelector(".confirm");
const disproveBtn = confirmationPopup.querySelector(".disprove");

const darken = document.querySelector(".darken");

let promiseResolve = (placeholder) => {};
// confirmation process
function confirmation(text) {
    confirmationPopup.classList.add("active");
    confirmationContent.innerText = text;
    darken.classList.add("active");

    const promise = new Promise((res) => {
        promiseResolve = res;

        confirmBtn.addEventListener("click", () => {
            confirmationPopup.classList.remove("active");
            darken.classList.remove("active");
            res(true);
        });

        disproveBtn.addEventListener("click", () => {
            confirmationPopup.classList.remove("active");
            darken.classList.remove("active");
            res(false);
        });
    });

    return promise;
}

// cancel confirmation
darken.addEventListener("click", () => {
    darken.classList.remove("active");
    confirmationPopup.classList.remove("active");
    promiseResolve(false);
});

// export function
export default confirmation;
