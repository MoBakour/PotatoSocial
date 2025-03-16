const form = document.querySelector("form");
const email = document.querySelector("input[name='email']");
const username = document.querySelector("input[name='username']");
const password = document.querySelector("input[name='password']");
const repassword = document.querySelector("input[name='repassword']");
const errorField = document.querySelector(".error-field");

let signupLocked = false;
form.addEventListener("submit", (e) => {
    if (signupLocked) return false;
    signupLocked = true;

    e.preventDefault();

    fetch("/signup", {
        method: "POST",
        body: JSON.stringify({
            email: email.value.trim(),
            username: username.value.trim(),
            password: password.value.trim(),
            repassword: repassword.value.trim(),
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
        .finally(() => (signupLocked = false));
});
