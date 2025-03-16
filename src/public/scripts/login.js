const form = document.querySelector("form");
const username = document.querySelector("input[name='username']");
const password = document.querySelector("input[name='password']");
const errorField = document.querySelector(".error-field");

let loginLocked = false;
form.addEventListener("submit", (e) => {
    if (loginLocked) return false;
    loginLocked = true;

    e.preventDefault();

    fetch("/login", {
        method: "POST",
        body: JSON.stringify({
            username: username.value.trim(),
            password: password.value.trim(),
        }),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                location.href = "/";
            } else {
                errorField.innerText = data.error;
            }
        })
        .catch((err) => console.log(err))
        .finally(() => {
            loginLocked = false;
        });
});
