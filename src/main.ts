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

createButton("clear", buttonContainer, onClearClick);
createButton("undo", buttonContainer, onUndoClick);
createButton("redo", buttonContainer, onRedoClick);
const thinButton = createButton("thin", buttonContainer, onThinClick);
const thickButton = createButton("thick", buttonContainer, onThickClick);

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
const lastPoint = { x: 0, y: 0 };
let lineThickness = 1;
const context = canvas.getContext("2d");
let toolPreview: ToolPreview | null = null;

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);

function handleMouseDown(e: MouseEvent) {
  lastPoint.x = e.offsetX;
  lastPoint.y = e.offsetY;
  isDrawing = true;
  redoStack = [];
  currentLine = new Line({ x: lastPoint.x, y: lastPoint.y }, lineThickness);
}

// canvas event listeners

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
  toolPreview?.display(context);
}

// button event listeners
function onClearClick() {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function onUndoClick() {
  const line = lines.pop();
  if (line) {
    redoStack.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
}

function onRedoClick() {
  const line = redoStack.pop();
  if (line) {
    lines.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
}

function onThinClick() {
  lineThickness = 1;
  toggleButtonSelection(thinButton);
}

function onThickClick() {
  lineThickness = 5;
  toggleButtonSelection(thickButton);
}

function toggleButtonSelection(selectedButton: HTMLButtonElement) {
  const buttons = buttonContainer.querySelectorAll("button");
  buttons.forEach((button) => {
    button.classList.toggle("selected", button === selectedButton);
  });
}
