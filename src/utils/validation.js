const zod = require("zod");

const reservedWords = ["login", "signup", "settings", "logout", "requests"];

const userSchema = zod.object({
    email: zod
        .string("Email must be a string")
        .min(1, "Email is required")
        .email("Invalid email address")
        .max(320, "Email length must be at most 320 characters"),
    username: zod
        .string("Username must be a string")
        .min(1, "Username is required")
        .min(3, "Username length must be at least 3 characters")
        .max(30, "Username length must be at most 30 characters")
        .regex(
            /^[a-zA-Z0-9_.]+$/,
            "Username can only contain alphanumeric characters, underscores, and dots"
        )
        .refine((data) => {
            if (reservedWords.includes(data.toLowerCase())) {
                throw new Error("This username is not allowed");
            }
            return true;
        }),
    password: zod
        .string("Password must be a string")
        .min(1, "Password is required")
        .min(6, "Password length must be at least 6 characters")
        .max(100, "Password length must be at most 100 characters"),
    repassword: zod
        .string("Password confirmation must be a string")
        .min(1, "Password confirmation is required"),
});

const confirmPassword = (data, ctx) => {
    if (data.password !== data.repassword) {
        ctx.addIssue({
            message: "Incorrect password confirmation",
        });
    }
};

const signupSchema = userSchema.superRefine(confirmPassword);
const updateAccountSchema = userSchema
    .extend({
        bio: zod.string().max(300, "Bio length must be at most 300 characters"),
    })
    .partial()
    .superRefine(confirmPassword);

// exports
module.exports = { signupSchema, updateAccountSchema };
