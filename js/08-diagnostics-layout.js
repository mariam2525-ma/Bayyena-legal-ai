/**
 * 08-diagnostics-layout.js — Connection diagnostics (#diag) and responsive header fitting.
 */

/**
 * Runs live connectivity diagnostics against all configured n8n webhook paths across candidate hosts
 * (`mariamhan5` and `maryamabo`) and displays a fixed overlay report with HTTP status codes.
 * Triggered automatically when `#diag` or `?diag` is present in the URL.
 * @returns {Promise<void>}
 */
async function diag() {
  var hosts = ["mariamhan5", "maryamabo"],
    endpointPaths = {
      review: "legal-ai/review",
      draft: "legal-ai/draft",
      research: "legal-ai/research",
      chat: "legal-ai/chat",
      web: "legal-ai/web-search",
      translate: "translate-contract-hybrid",
      support: "legal-ai/support",
    };
  var box = document.createElement("pre");
  box.style.cssText =
    "position:fixed;inset:10px;z-index:99999;background:#fff;color:#000;padding:16px;overflow:auto;direction:ltr;text-align:left;font:13px/1.6 monospace;border:2px solid #000;white-space:pre-wrap";
  box.textContent = "Testing...";
  document.body.append(box);
  var diagnosticOutput = "";
  for (var endpointKey in endpointPaths) {
    for (var i = 0; i < hosts.length; i++) {
      var hostName = hosts[i],
        diagnosticStatus,
        abortController = new AbortController(),
        timeoutId = setTimeout(function () {
          abortController.abort();
        }, 15000);
      try {
        var response = await fetch(
          "https://" +
            hostName +
            ".app.n8n.cloud/webhook/" +
            endpointPaths[endpointKey],
          {
            method: "POST",
            signal: abortController.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer diag",
            },
            body: '{"ping":true}',
          },
        );
        diagnosticStatus = "HTTP " + response.status + " (reachable)";
      } catch (e) {
        diagnosticStatus =
          "NOT REACHABLE (" +
          (e && e.name === "AbortError"
            ? "timeout"
            : "no response / CORS / not active") +
          ")";
      }
      clearTimeout(timeoutId);
      diagnosticOutput +=
        (endpointKey + "          ").slice(0, 10) +
        (hostName + "            ").slice(0, 12) +
        diagnosticStatus +
        "\n";
      box.textContent = diagnosticOutput + "...";
    }
  }
  box.textContent =
    diagnosticOutput + "\nDone. Copy this text and send it. (tap to close)";
  box.onclick = function () {
    box.remove();
  };
}
var _dg = 0;

/**
 * Checks whether the current URL hash or query string requests `#diag` mode and launches `diag()` once.
 * @returns {void}
 */
function _diag() {
  if (
    !_dg &&
    (location.hash === "#diag" || /[?&]diag\b/.test(location.search))
  ) {
    _dg = 1;
    diag();
  }
}
addEventListener("hashchange", _diag);
_diag();
applyLang();
(function () {
  var header = document.querySelector(".hd"),
    container = header.querySelector(".c"),
    nav = header.querySelector("nav"),
    brand = header.querySelector(".brand"),
    controls = header.querySelector(".ctl"),
    frameScheduled = 0;

  /**
   * Computes whether the header navigation items and controls overflow the available container width.
   * @returns {boolean} True when the header contents exceed `c.clientWidth`.
   */
  function need() {
    var visibleItems = [].filter.call(nav.children, function (navigationItem) {
        return navigationItem.offsetWidth > 0;
      }),
      columnGap = parseFloat(getComputedStyle(nav).columnGap) || 20,
      navigationWidth =
        visibleItems.reduce(function (totalWidth, x) {
          return totalWidth + x.offsetWidth;
        }, 0) +
        columnGap * Math.max(0, visibleItems.length - 1);
    return (
      brand.offsetWidth + navigationWidth + controls.offsetWidth + 70 >
      container.clientWidth
    );
  }

  /**
   * Adjusts `.hd` responsive classes (`nocta`, `compact`) so header navigation fits without wrapping.
   * @returns {void}
   */
  function fit() {
    frameScheduled = 0;
    header.classList.remove("nocta", "compact");
    if (innerWidth <= 860) {
      header.classList.add("compact");
      return;
    }
    if (need()) header.classList.add("nocta");
    if (need()) header.classList.add("compact");
  }

  /**
   * Schedules a single `requestAnimationFrame` pass to run `fit()` on resize or DOM mutation.
   * @returns {void}
   */
  function sched() {
    if (!frameScheduled) {
      frameScheduled = 1;
      requestAnimationFrame(fit);
    }
  }
  addEventListener("resize", sched);
  new MutationObserver(sched).observe(header, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
})();
