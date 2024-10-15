import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = "Sticky Pad";

const title = document.createElement("h1");
title.innerHTML = "Sticky Pad";
app.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

interface Point {
  x: number;
  y: number;
}

let points: Point[][] = [];
let currentLine: Point[] = [];

let isDrawing = false;
let x = 0;
let y = 0;
const context = canvas.getContext("2d");

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  if (!context) {
    return;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  points = [];
});

// Add the event listeners for mousedown, mousemove, and mouseup
// https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
canvas.addEventListener("mousedown", (e) => {
  x = e.offsetX;
  y = e.offsetY;
  isDrawing = true;
  currentLine.push({ x, y });
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    drawLine(context, x, y, e.offsetX, e.offsetY);
    x = e.offsetX;
    y = e.offsetY;
    currentLine.push({ x, y });
  }
});

canvas.addEventListener("drawing-changed", () => {
  if (!context) {
    return;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  points.forEach((line) => {
    for (let i = 1; i < line.length; i++) {
      drawLine(context, line[i - 1].x, line[i - 1].y, line[i].x, line[i].y);
    }
  });
  if (currentLine.length > 1) {
    for (let i = 1; i < currentLine.length; i++) {
      drawLine(
        context,
        currentLine[i - 1].x,
        currentLine[i - 1].y,
        currentLine[i].x,
        currentLine[i].y
      );
    }
  }
  // if (currentLine.length > 2) {
  //   drawLine(
  //     context,
  //     currentLine[currentLine.length - 2].x,
  //     currentLine[currentLine.length - 2].y,
  //     currentLine[currentLine.length - 1].x,
  //     currentLine[currentLine.length - 1].y
  //   );
  // }
});

document.addEventListener("mouseup", () => {
  if (isDrawing) {
    points.push(currentLine);
    currentLine = [];
    isDrawing = false;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

function drawLine(
  context: CanvasRenderingContext2D | null,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  if (!context) {
    return;
  }
  context.beginPath();
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
}
