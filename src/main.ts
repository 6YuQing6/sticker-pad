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

let lines: Point[][] = [];
let currentLine: Point[] = [];
let redoStack: Point[][] = [];

let isDrawing = false;
let lastX = 0;
let lastY = 0;
const context = canvas.getContext("2d");

const buttonDiv = document.createElement("div");
app.append(buttonDiv);

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
buttonDiv.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
buttonDiv.append(undoButton);

undoButton.addEventListener("click", () => {
  const line = lines.pop();
  if (line) {
    redoStack.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
buttonDiv.append(redoButton);

redoButton.addEventListener("click", () => {
  const line = redoStack.pop();
  if (line) {
    lines.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

clearButton.addEventListener("click", () => {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Add the event listeners for mousedown, mousemove, and mouseup
canvas.addEventListener("mousedown", (e) => {
  lastX = e.offsetX;
  lastY = e.offsetY;
  isDrawing = true;
  redoStack = [];
  currentLine = [{ x: lastX, y: lastY }];
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    const newX = e.offsetX;
    const newY = e.offsetY;
    currentLine.push({ x: newX, y: newY });
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("drawing-changed", () => {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => {
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
});

document.addEventListener("mouseup", () => {
  if (isDrawing) {
    lines.push(currentLine);
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
  if (!context) return;
  context.beginPath();
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
}
