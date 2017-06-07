function recursiveCall(index, len, status, func) {
    func(index, status, function (res, count) {
        if (res == "next") {
            index = index + len;
            if (index == count) {
                recursiveCall(index, len, "r", func);
            } else {
                return func(index, "done", function () {
                });
            }
        }
    });
}

module.exports = recursiveCall;