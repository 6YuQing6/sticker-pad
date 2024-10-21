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

const buttonContainer = document.createElement("div");
app.append(buttonContainer);

createButton("clear", buttonContainer, clearCanvas);
createButton("undo", buttonContainer, undoLastLine);
createButton("redo", buttonContainer, redoLastLine);
const thinButton = createButton("thin", buttonContainer, setThin);
const thickButton = createButton("thick", buttonContainer, setThick);

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

interface Displayable {
  display(context: CanvasRenderingContext2D): void;
}

interface Point {
  x: number;
  y: number;
}

class Line implements Displayable {
  points: Point[];
  thickness: number;
  constructor(point: Point, thickness: number) {
    this.points = [point];
    this.thickness = thickness;
  }

  display(context: CanvasRenderingContext2D) {
    this.points.reduce((prevPoint, currPoint) => {
      this.drawLine(context, prevPoint, currPoint);
      return currPoint;
    });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  private drawLine(
    context: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = this.thickness;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
  }
}

let lines: Displayable[] = [];
let currentLine: Line | null = null;
let redoStack: Displayable[] = [];
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let lineThickness = 1;
const context = canvas.getContext("2d");

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
document.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("drawing-changed", redrawCanvas);

function startDrawing(e: MouseEvent) {
  lastX = e.offsetX;
  lastY = e.offsetY;
  isDrawing = true;
  redoStack = [];
  currentLine = new Line({ x: lastX, y: lastY }, lineThickness);
}

// canvas event listeners
function draw(e: MouseEvent) {
  if (!isDrawing) return;
  const newX = e.offsetX;
  const newY = e.offsetY;
  currentLine?.drag(newX, newY);
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function stopDrawing() {
  if (!isDrawing || !currentLine) return;
  lines.push(currentLine);
  currentLine = null;
  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function redrawCanvas() {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => {
    line.display(context);
  });
  currentLine?.display(context);
}

// button event listeners
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

function setThin() {
  lineThickness = 1;
  toggleButtonSelection(thinButton);
}

function setThick() {
  lineThickness = 5;
  toggleButtonSelection(thickButton);
}

function toggleButtonSelection(selectedButton: HTMLButtonElement) {
  const buttons = buttonContainer.querySelectorAll("button");
  buttons.forEach((button) => {
    button.classList.toggle("selected", button === selectedButton);
  });
}
