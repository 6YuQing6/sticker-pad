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

const buttonContainer = document.createElement("div");
app.append(buttonContainer);

createButton("clear", buttonContainer, clearCanvas);
createButton("undo", buttonContainer, undoLastLine);
createButton("redo", buttonContainer, redoLastLine);

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
document.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("drawing-changed", redrawCanvas);

function createButton(
  label: string,
  container: HTMLElement,
  onClick: () => void
) {
  const button = document.createElement("button");
  button.innerHTML = label;
  button.addEventListener("click", onClick);
  container.append(button);
  return button;
}

function startDrawing(e: MouseEvent) {
  lastX = e.offsetX;
  lastY = e.offsetY;
  isDrawing = true;
  redoStack = [];
  currentLine = [{ x: lastX, y: lastY }];
}

function draw(e: MouseEvent) {
  if (!isDrawing) return;
  const newX = e.offsetX;
  const newY = e.offsetY;
  currentLine.push({ x: newX, y: newY });
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function stopDrawing() {
  if (!isDrawing) return;
  lines.push(currentLine);
  currentLine = [];
  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function clearCanvas() {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function undoLastLine() {
  const line = lines.pop();
  if (line) {
    redoStack.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
}

function redoLastLine() {
  const line = redoStack.pop();
  if (line) {
    lines.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
}

function redrawCanvas() {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => drawLineSegments(line));
  drawLineSegments(currentLine);
}

function drawLineSegments(line: Point[]) {
  if (!context) return;
  for (let i = 1; i < line.length; i++) {
    drawLine(context, line[i - 1], line[i]);
  }
}

function drawLine(context: CanvasRenderingContext2D, start: Point, end: Point) {
  context.beginPath();
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.closePath();
}
