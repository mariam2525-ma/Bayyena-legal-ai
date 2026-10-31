/* سياسة الخصوصية وشروط الاستخدام: مضمّنة في الصفحة فتعمل بدون رفع ملف PDF منفصل */
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest("a.pol");
  if (!a) return;
  e.preventDefault();
  try {
    var binaryPolicyData = atob(window.POLICY_PDF),
      policyBytes = new Uint8Array(binaryPolicyData.length);
    for (var i = 0; i < binaryPolicyData.length; i++)
      policyBytes[i] = binaryPolicyData.charCodeAt(i);
    var url = URL.createObjectURL(
      new Blob([policyBytes], { type: "application/pdf" }),
    );
    var popupWindow = window.open(url, "_blank");
    if (!popupWindow) {
      var downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "Muhkam — Privacy Policy and Terms of Use.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    }
  } catch (err) {
    window.open(a.getAttribute("href"), "_blank");
  }
});
