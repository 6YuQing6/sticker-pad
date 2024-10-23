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

interface Displayable {
  display(context: CanvasRenderingContext2D): void;
}

interface Point {
  x: number;
  y: number;
}

let lines: Displayable[] = [];
let currentLine: Line | null = null;
let redoStack: Displayable[] = [];
let isDrawing = false;
const lastPoint = { x: 0, y: 0 };
let lineThickness = 1;
const context = canvas.getContext("2d");
let toolPreview: ToolPreview | null = null;
let selectedSticker: Sticker | null = null;

// function buttons
createButton("clear", buttonContainer, () => {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

createButton("undo", buttonContainer, () => {
  const line = lines.pop();
  if (line) {
    redoStack.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

createButton("redo", buttonContainer, () => {
  const line = redoStack.pop();
  if (line) {
    lines.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// tool buttons
const toolContainer = document.createElement("div");
app.append(toolContainer);

const thinButton = createButton("thin", toolContainer, () => {
  lineThickness = 1;
  toggleButtonSelection(thinButton);
});
const thickButton = createButton("thick", toolContainer, () => {
  lineThickness = 5;
  toggleButtonSelection(thickButton);
});

const stickerDisplay: string[] = ["😆", "🍔", "✨"];
stickerDisplay.forEach((sticker) => {
  const stickerButton = createButton(`${sticker}`, toolContainer, () => {
    toggleButtonSelection(stickerButton);
  });
});

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

function toggleButtonSelection(selectedButton: HTMLButtonElement) {
  const buttons = toolContainer.querySelectorAll("button");
  buttons.forEach((button) => {
    button.classList.toggle("selected", button === selectedButton);
  });
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

class Sticker implements Displayable {
  position: Point;
  text: string;
  constructor(position: Point, text: string) {
    this.position = position;
    this.text = text;
  }
  display(context: CanvasRenderingContext2D): void {
    context.fillText(this.text, this.position.x, this.position.y);
  }
}

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  lastPoint.x = e.offsetX;
  lastPoint.y = e.offsetY;
  isDrawing = true;
  redoStack = [];
  currentLine = new Line({ x: lastPoint.x, y: lastPoint.y }, lineThickness);
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
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
});

document.addEventListener("mouseup", () => {
  if (!isDrawing || !currentLine) return;
  lines.push(currentLine);
  currentLine = null;
  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);

function redrawCanvas() {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => {
    line.display(context);
  });
  currentLine?.display(context);
  toolPreview?.display(context);
}
