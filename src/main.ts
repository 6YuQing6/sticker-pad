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

let displayList: Displayable[] = [];
let currentLine: Line | null = null;
let redoStack: Displayable[] = [];
let isDrawing = false;
const lastPoint = { x: 0, y: 0 };
let lineThickness = 1;
const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Failed to get 2D context");
}
let toolPreview: ToolPreview | null = null;
let currentSticker: Sticker | null = null;
let selectedSticker: string | undefined = undefined;

// function buttons
createButton("clear", buttonContainer, () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  displayList = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
  currentSticker = null;
});

createButton("undo", buttonContainer, () => {
  const line = displayList.pop();
  if (line) {
    redoStack.push(line);
    console.log(redoStack);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

createButton("redo", buttonContainer, () => {
  const line = redoStack.pop();
  if (line) {
    displayList.push(line);
    console.log(displayList);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// tool buttons
const toolContainer = document.createElement("div");
app.append(toolContainer);

const thinButton = createButton("thin", toolContainer, () => {
  lineThickness = 1;
  toggleButtonSelection(thinButton);
  currentSticker = null;
  selectedSticker = "";
});
const thickButton = createButton("thick", toolContainer, () => {
  lineThickness = 5;
  toggleButtonSelection(thickButton);
  currentSticker = null;
  selectedSticker = "";
});

const stickerDisplay: string[] = ["😆", "🍔", "✨"];
stickerDisplay.forEach((sticker) => {
  const stickerButton = createButton(`${sticker}`, toolContainer, () => {
    toggleButtonSelection(stickerButton);
    selectedSticker = `${sticker}`;
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

  drag(point: Point) {
    this.points.push({ x: point.x, y: point.y });
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
  text: string;

  constructor(position: Point, text: string = "") {
    this.position = position;
    this.text = text;
  }

  display(context: CanvasRenderingContext2D) {
    if (this.text) {
      // for sticker preview
      context.font = "32px monospace";
      context.fillText(this.text, this.position.x, this.position.y);
    } else {
      // for line width preiew, draws a circle
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
}

class Sticker implements Displayable {
  position: Point;
  text: string;
  constructor(position: Point, text: string) {
    this.position = position;
    this.text = text;
  }
  display(context: CanvasRenderingContext2D): void {
    context.font = "32px monospace";
    context.fillText(this.text, this.position.x, this.position.y);
  }
  drag(point: Point) {
    this.position.x = point.x;
    this.position.y = point.y;
  }
}

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  redrawCanvas();
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  lastPoint.x = e.offsetX;
  lastPoint.y = e.offsetY;
  isDrawing = true;
  redoStack = [];
  if (selectedSticker) {
    currentSticker = new Sticker(
      { x: lastPoint.x, y: lastPoint.y },
      selectedSticker
    );
  } else {
    currentLine = new Line({ x: lastPoint.x, y: lastPoint.y }, lineThickness);
  }
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (!isDrawing) {
    // creates new tool preview of selected tool
    toolPreview = new ToolPreview(
      { x: e.offsetX, y: e.offsetY },
      selectedSticker
    );
    canvas.dispatchEvent(new Event("tool-moved"));
  } else {
    // when drawing the tool preview will disappear
    toolPreview = null;
    const newPoint: Point = { x: e.offsetX, y: e.offsetY };
    if (currentSticker) {
      currentSticker?.drag(newPoint);
      canvas.dispatchEvent(new Event("tool-moved"));
    } else {
      currentLine?.drag(newPoint);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

document.addEventListener("mouseup", () => {
  if (!isDrawing) return;
  if (currentSticker) {
    displayList.push(currentSticker);
    currentSticker = null;
  } else {
    if (!currentLine) return;
    displayList.push(currentLine);
    currentLine = null;
  }

  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const redrawCanvas = () => {
  context?.clearRect(0, 0, canvas.width, canvas.height);
  displayList.forEach((displayable) => {
    displayable.display(context);
  });
  currentLine?.display(context); // to show current line drawn when mouse is moving
  currentSticker?.display(context);
  toolPreview?.display(context);
};

canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);
