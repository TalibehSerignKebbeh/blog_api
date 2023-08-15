



const validateEmptyOrNull = (input) => {
    if (input === null || input === undefined) {
        false
    }
    if (input === "") {
        false
    }
    return true
}

const minLength = 4;
const maxLength = 16;
const usernameRegex = /^[a-zA-Z0-9_-]{5,16}$/;
const passwordRegex =  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*#?&])[a-zA-Z\d@$!%*#?&]{5,16}$/;

const validateUsername = (input, min, max,) => {
    if (input === null || input === undefined) {
        false
    }
    if (input === "") {
        false
    }
    if (input?.length < min) {

    }
    return true
}

const passwordErrorMessage = 'password is required, with at least 5 characters and at most 16 characters and must contain atleast a an uppercase, lowercase letter and one of the special characters (@$!%*#?&)'
const usernameErrorMessage = "invalid username, only alphanumeric characters with underscores hyphens are allowed, minimum length of 5 and max length of 16"
module.exports = {
    validateEmptyOrNull,
    usernameRegex,
    passwordRegex,
    usernameErrorMessage,
    passwordErrorMessage
}