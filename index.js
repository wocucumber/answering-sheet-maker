const inputArea = document.getElementById("input");
const resultArea = document.getElementById("result");
const canvas = document.getElementById("canvas");
let fileName = null;
let lastSVG = null;
let lastSVGH = null;
let lastSVGW = null;
const [w] = [500];

// Convert
document.getElementById("convert").addEventListener("click", () => {
  resultArea.innerHTML = "";
  const [result, y, x] = convert(inputArea.value);
  result.addTo('#result');
  lastSVG = result.svg();
  lastSVGH = y;
  lastSVGW = x;

  convert2canvas(lastSVG, lastSVGW, lastSVGH, canvas)
});

document.getElementById("download").addEventListener("click", () => {
  if (lastSVG) {
    const url = canvas2png(canvas);

    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName || "解答用紙")+".png";

    a.click();
  }
});

document.getElementById("download-open").addEventListener("click", () => {
  if (lastSVG) {
    const url = canvas2png(canvas);

    if (!window.open(url, "_blank"))
      location.href = url;
  }
});


// Load and Save
document.getElementById("load").addEventListener("change", (e) => {
  /**
   * @type {File[]}
   */
  const files = e.target.files;
  if (files[0]) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      inputArea.value = reader.result;
    });
    reader.readAsText(files[0]);
    fileName = files[0].name;
  }
});
document.getElementById("save").addEventListener("click", () => {
  const value = inputArea.value;

  const file = new Blob([value], {
    type: "text/plain",
  });

  const url = URL.createObjectURL(file);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "解答用紙.kymk.txt";

  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
});