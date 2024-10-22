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

class ToolPreview implements Displayable {
  position: Point;

  constructor(position: Point) {
    this.position = position;
  }

  display(context: CanvasRenderingContext2D) {
    console.log("tool preview");
    context.beginPath();
    context.arc(
      this.position.x,
      this.position.y,
      lineThickness,
      0,
      Math.PI * 2
    );
    context.strokeStyle = "red";
    context.lineWidth = 3;
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
let toolPreview: ToolPreview | null = null;

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", handleToolMoved);

function handleMouseDown(e: MouseEvent) {
  lastX = e.offsetX;
  lastY = e.offsetY;
  isDrawing = true;
  redoStack = [];
  currentLine = new Line({ x: lastX, y: lastY }, lineThickness);
}

// canvas event listeners

function handleToolMoved() {
  if (!context) return;
  redrawCanvas();
  toolPreview?.display(context);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDrawing) {
    toolPreview = new ToolPreview({ x: e.offsetX, y: e.offsetY });
    canvas.dispatchEvent(new Event("tool-moved"));
  } else {
    toolPreview = null;
    const newX = e.offsetX;
    const newY = e.offsetY;
    currentLine?.drag(newX, newY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
}

function handleMouseUp() {
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
