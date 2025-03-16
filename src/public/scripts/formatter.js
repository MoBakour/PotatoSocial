function formatDate(date, format) {
    // check if valid date
    function isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    // destructure date object
    const fullDate = isValidDate(new Date(date))
            ? new Date(date)
            : new Date(Number(date)),
        _date = fullDate.getDate(),
        _month = fullDate.getMonth() + 1,
        _year = fullDate.getFullYear(),
        year_ = _year.toString().substring(2),
        hour = fullDate.getHours(),
        _hour = (() => {
            if (hour == 0) return 12;
            return hour > 12 ? hour - 12 : hour;
        })(),
        _minute = fullDate.getMinutes().toString().padStart(2, "0"),
        dayTime = (() => {
            return hour >= 12 ? "PM" : "AM";
        })(),
        months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

    // format
    switch (format.toLowerCase()) {
        case "mm/dd/yyyy":
            return `${_month}/${_date}/${_year}`;
        case "dd/mm/yyyy":
            return `${_date}/${_month}/${_year}`;
        case "mm/dd/yy":
            return `${_month}/${_date}/${year_}`;
        case "dd/mm/yy":
            return `${_date}/${_month}/${year_}`;
        case "dd mm, yy":
            return `${_date} ${months[_month - 1]}, ${year_}`;
        case "dd mm, yy tt":
            return `${_date} ${
                months[_month - 1]
            }, ${year_} at ${_hour}:${_minute} ${dayTime}`;
        case "hh:mm":
            return `${hour}:${_minute}`;
        case "hh:mm a":
            return `${_hour}:${_minute} ${dayTime}`;
        default:
            throw Error("formatDate() received an undefined format");
    }
}

function formatNumber(number, rounded = false) {
    number = Number(number);
    let divideBy = 1;
    let suffix = "";
    let formattedNum;

    if (number >= 1000 && number < 1000000) {
        divideBy = 1000;
        suffix = "K";
    }
    if (number >= 1000000 && number < 1000000000) {
        divideBy = 1000000;
        suffix = "M";
    }
    if (number >= 1000000000 && number < 1000000000000) {
        divideBy = 1000000000;
        suffix = "B";
    }
    if (number >= 1000000000000 && number < 1000000000000000) {
        divideBy = 1000000000000;
        suffix = "T";
    }
    if (number >= 1000000000000000 && number < 1000000000000000000) {
        divideBy = 1000000000000000;
        suffix = "Q";
    }

    // rounding mechanism
    if (rounded) formattedNum = Math.round(number / divideBy);
    else formattedNum = (number / divideBy).toFixed(1);

    return `${formattedNum}${suffix}`;
}

export { formatNumber, formatDate };
