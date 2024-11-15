import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.insertBefore(canvas, app.children[1]);

const buttonContainer =
  document.querySelector<HTMLDivElement>("#buttonContainer")!;

const toolContainer = document.querySelector<HTMLDivElement>("#toolContainer")!;

interface Displayable {
  display(context: CanvasRenderingContext2D): void;
  drag(point: Point): void;
}

interface Point {
  x: number;
  y: number;
}

const THIN_LINE = 1;
const THICK_LINE = 4;
let lineThickness = THIN_LINE;
let isDrawing = false;
const lastPoint = { x: 0, y: 0 };
let displayStack: Displayable[] = [];
let redoStack: Displayable[] = [];
let toolPreview: Displayable | null = null;
let currentDisplayItem: Displayable | null = null;
let selectedSticker: string | undefined = undefined;

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Failed to get 2D context");
}

let currentColor = "#000000";
const colorPicker = document.getElementById("picker") as HTMLInputElement;
colorPicker.type = "color";
colorPicker.value = currentColor;
colorPicker.style.margin = "10px";
app.append(colorPicker);

colorPicker.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement | null;
  if (target) {
    currentColor = target.value;
  }
});

// Displayable functions
function createLine(
  point: Point,
  thickness: number,
  color: string
): Displayable {
  const points: Point[] = [point];

  function display(context: CanvasRenderingContext2D) {
    // draws line from previous point to the next point in points array
    points.reduce((prevPoint, currPoint) => {
      drawLine(context, prevPoint, currPoint);
      return currPoint;
    });
  }

  function drag(point: Point) {
    points.push({ x: point.x, y: point.y });
  }
  function drawLine(
    context: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = thickness;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
  }

  return { display, drag };
}

function createToolPreview(position: Point, text: string = ""): Displayable {
  function display(context: CanvasRenderingContext2D) {
    if (text) {
      // for sticker preview
      context.font = "32px monospace";
      context.fillText(text, position.x, position.y);
    } else {
      // for line width preview, draws a circle
      context.beginPath();
      context.arc(position.x, position.y, lineThickness, 0, Math.PI * 2);
      context.strokeStyle = currentColor;
      context.lineWidth = 3;
      context.stroke();
      context.closePath();
    }
  }

  function drag() {}

  return { display, drag };
}

function createSticker(position: Point, text: string): Displayable {
  function display(context: CanvasRenderingContext2D) {
    context.font = "32px monospace";
    context.fillText(text, position.x, position.y);
  }

  function drag(point: Point) {
    position.x = point.x;
    position.y = point.y;
  }

  return { display, drag };
}

// Utility functions
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

const createStickerButton = (text: string, container: HTMLElement) => {
  const stickerButton = createButton(text, container, () => {
    toggleButtonSelection(stickerButton);
    selectedSticker = text;
  });
};

function toggleButtonSelection(selectedButton: HTMLButtonElement) {
  const buttons = toolContainer.querySelectorAll("button");
  buttons.forEach((button) => {
    button.classList.toggle("selected", button === selectedButton);
  });
}

function exportCanvas(isTransparent: boolean) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportContext = exportCanvas.getContext("2d")!;
  if (!exportContext) {
    throw new Error("Failed to get 2D context for export canvas");
  }

  if (!isTransparent) {
    exportContext.fillStyle = "oklch(95.33% 0.0897 99)";
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  // Scales content to match larger canvas
  exportContext.scale(4, 4);

  // Execute display list items on the new context
  displayStack.forEach((displayable) => {
    displayable.display(exportContext);
  });

  // Trigger file download
  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();

  // Close the dialog
  exportDialog.close();
}

// Button creation
createButton("clear", buttonContainer, () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  displayStack = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
  currentDisplayItem = null;
});

createButton("undo", buttonContainer, () => {
  const line = displayStack.pop();
  if (line) {
    redoStack.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

createButton("redo", buttonContainer, () => {
  const line = redoStack.pop();
  if (line) {
    displayStack.push(line);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// export button
const exportDialog = document.getElementById(
  "exportDialog"
) as HTMLDialogElement;
const transparentButton = document.getElementById(
  "transparent"
) as HTMLButtonElement;
const closeDialogButton = document.getElementById(
  "closeDialog"
) as HTMLButtonElement;

const opaqueButton = document.getElementById("opaque") as HTMLButtonElement;

// Add event listener to model dialog export setting buttons
createButton("export", buttonContainer, () => {
  exportDialog.showModal();
});

transparentButton.addEventListener("click", () => {
  exportCanvas(true);
});

opaqueButton.addEventListener("click", () => {
  exportCanvas(false);
});

closeDialogButton.addEventListener("click", () => {
  exportDialog.close();
});

const thinButton = createButton("thin", toolContainer, () => {
  lineThickness = THIN_LINE;
  toggleButtonSelection(thinButton);
  currentDisplayItem = null;
  selectedSticker = "";
});
thinButton.className = "selected";
const thickButton = createButton("thick", toolContainer, () => {
  lineThickness = THICK_LINE;
  toggleButtonSelection(thickButton);
  currentDisplayItem = null;
  selectedSticker = "";
});

// create new sticker button
createButton("+", toolContainer, () => {
  const text = globalThis.prompt("Custom sticker prompt", "❤️");
  if (text) {
    createStickerButton(text, toolContainer);
  }
});

["😆", "🍔", "✨"].forEach((sticker) => {
  createStickerButton(sticker, toolContainer);
});

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
    currentDisplayItem = createSticker(
      { x: lastPoint.x, y: lastPoint.y },
      selectedSticker
    );
  } else {
    currentDisplayItem = createLine(
      { x: lastPoint.x, y: lastPoint.y },
      lineThickness,
      currentColor
    );
  }
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (!isDrawing) {
    // creates new tool preview of selected tool
    toolPreview = createToolPreview(
      { x: e.offsetX, y: e.offsetY },
      selectedSticker
    );
    canvas.dispatchEvent(new Event("tool-moved"));
  } else {
    // when drawing the tool preview will disappear
    toolPreview = null;
    const newPoint: Point = { x: e.offsetX, y: e.offsetY };
    currentDisplayItem?.drag(newPoint);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

document.addEventListener("mouseup", () => {
  if (!isDrawing) return;
  if (currentDisplayItem) displayStack.push(currentDisplayItem);
  currentDisplayItem = null;
  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const redrawCanvas = () => {
  context?.clearRect(0, 0, canvas.width, canvas.height);
  displayStack.forEach((displayable) => {
    displayable.display(context);
  });
  currentDisplayItem?.display(context);
  toolPreview?.display(context);
};

canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);
