// imports
import { formatNumber } from "./formatter.js";

// selectors
const allBtns = document.querySelectorAll("button.accept, button.reject");
const generalBtns = document.querySelectorAll(".requests-header button");
const requestsNumber = document.querySelector(
    ".requests-header h1 span[data-number]"
);
const requestsContent = document.querySelector(".requests-content");

// send response function
let responseLock = false;
function sendResponse(response, requesterId) {
    if (responseLock) return false;
    responseLock = true;

    const fetchOptions = {
        method: "PATCH",
        body: JSON.stringify({ response, requesterId }),
        headers: { "Content-Type": "application/json" },
    };

    return new Promise((res) => {
        fetch("/respond", fetchOptions)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    [...document.querySelectorAll(".request")]
                        .filter((request) => {
                            return request.dataset.requesterId === requesterId;
                        })[0]
                        .remove();

                    setRequestsNumber();
                }
            })
            .catch((err) => console.log(err))
            .finally(() => {
                responseLock = false;
                res();
            });
    });
}

// set requests number
function setRequestsNumber() {
    requestsNumber.innerText = formatNumber(
        requestsContent.childElementCount,
        true
    );
}

// attach private listeners
allBtns.forEach((btn) => {
    const response = btn.dataset.response;
    const requester = btn.parentElement.parentElement.dataset.requesterId;
    btn.addEventListener("click", () => sendResponse(response, requester));
});

// attach general listeners
for (const btn of generalBtns) {
    btn.addEventListener("click", async () => {
        const response = btn.dataset.response;
        const responseBtns = document.querySelectorAll(`button.${response}`);

        for (const responseBtn of responseBtns) {
            const requester =
                responseBtn.parentElement.parentElement.dataset.requesterId;
            await sendResponse(response, requester);
        }
    });
}
