/**
 * 00-errlog.js — Captures the last console errors/warnings so they can be attached to support tickets.
 */
var ERRLOG = [];
["error", "warn"].forEach(function (methodName) {
  var originalMethod = console[methodName];
  console[methodName] = function () {
    try {
      ERRLOG.push(
        new Date().toISOString() +
          " " +
          [].slice
            .call(arguments)
            .map(function (consoleArgument) {
              return (
                (consoleArgument && consoleArgument.message) ||
                String(consoleArgument)
              );
            })
            .join(" ")
            .slice(0, 300),
      );
      if (ERRLOG.length > 8) ERRLOG.shift();
    } catch {}
    return originalMethod.apply(console, arguments);
  };
});
addEventListener("error", function (errorEvent) {
  console.error("window.error: " + errorEvent.message);
});
