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
    // drawLine(context, x, y, e.offsetX, e.offsetY);
    x = e.offsetX;
    y = e.offsetY;
    currentLine.push({ x, y });
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("drawing-changed", () => {
  if (!context) {
    return;
  }
  if (currentLine.length > 2) {
    drawLine(
      context,
      currentLine[currentLine.length - 2].x,
      currentLine[currentLine.length - 2].y,
      currentLine[currentLine.length - 1].x,
      currentLine[currentLine.length - 1].y
    );
  }
});

document.addEventListener("mouseup", (e) => {
  if (isDrawing) {
    console.log(currentLine);
    points.push(currentLine);
    currentLine = [];
    isDrawing = false;
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
