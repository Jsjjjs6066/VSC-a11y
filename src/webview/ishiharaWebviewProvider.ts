import * as vscode from "vscode";

export class IshiharaWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "bolji-pogled_ishihara-webview";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      console.log('[ColorWebviewProvider] message from webview:', data);
      switch (data.type) {
        case "showDiagnosis":
          vscode.window.showInformationMessage(data.diagnosis);
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ishihara Test</title>
  <style>
    :root {
      color-scheme: normal;
    }

    body {
      margin: 0;
      margin-left: 8px;
      margin-right: 8px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }

    h1 {
      margin: 0 0 0 0;
      font-size: 18px;
      color: var(--vscode-foreground);
    }

    .layout {
      display: grid;
      gap: 16px;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .toolbar button,
    .toolbar select,
    .btn {
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
      font-size: 12px;
      width: 100%;
    }

    .toolbar button:hover,
    .btn:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .canvas-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    canvas {
      max-width: 100%;
      border: 1px solid var(--vscode-editor-foreground);
      background: #fff;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
    }

    .status {
      padding: 12px;
      border-radius: 6px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-sideBar-border);
      line-height: 1.5;
    }

    .status span {
      font-weight: 600;
    }

    .controls {
      display: grid;
      gap: 10px;
      max-width: 100%;
    }

    .inputs {
      display: grid;
      gap: 10px;
    }

    .inputs label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    
    input[type="text"] {
      padding: 8px;
      border: none;
      width: calc(100% - 16px);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 12px;
      border-radius: 4px;
    }
    .input-div {
      width: 100%;
      border: 1px solid var(--vscode-input-border);
    }

    .button-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .button-row button {
      min-width: 120px;
    }
  </style>
</head>
<body>
  <div class="layout">
    <h1>Ishihara Canvas Test</h1>
    <button class="btn" id="startBtn">Start Test Sequence</button>

    <div style="display: none;" class="test">
      <div class="canvas-wrapper">
        <canvas id="plateCanvas" width="600" height="600"></canvas>
      </div>

      <div class="controls">
        <div class="inputs">
          <label>Type what number you see:
          </label>
          <div class="input-div">
            <input id="answerInput" type="text" placeholder="e.g. 12" autocomplete="off" />
          </div>
        </div>

        <div class="button-row">
          <button class="btn" id="submitBtn">Submit Answer</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const SIZE = 600;
    const TOTAL_CIRCLES = 1000;
    const BACKGROUND = '#ffffff';

    function getDiagnosis() {
      if (!results.control) {
        return VISION_PROBLEM_OR_DISPLAY;
      }
      if (!results.red_green) {
        return RED_GREEN_DEFICIENCY;
      }
      if (!results.blue_yellow) {
        return BLUE_YELLOW_DEFICIENCY;
      }
      return NORMAL_COLOR_VISION;
    }

    const PALETTES = {
      red_green: {
        on: ['rgb(249,187,130)', 'rgb(235,161,112)', 'rgb(252,205,132)'],
        off: ['rgb(156,165,148)', 'rgb(172,180,165)', 'rgb(187,185,100)', 'rgb(215,218,170)', 'rgb(229,213,125)', 'rgb(209,214,175)']
      },
      blue_yellow: {
        on: ['rgb(70,130,180)', 'rgb(65,105,225)', 'rgb(100,149,237)'],
        off: ['rgb(240,230,140)', 'rgb(250,250,210)', 'rgb(245,245,220)']
      },
      control: {
        on: ['rgb(40,40,40)'],
        off: ['rgb(210,210,210)']
      }
    };

    const tests = [
      { key: 'control', label: 'Control' },
      { key: 'red_green', label: 'Red/Green' },
      { key: 'blue_yellow', label: 'Blue/Yellow' }
    ];

    const canvas = document.getElementById('plateCanvas');
    const ctx = canvas.getContext('2d');
    const answerInput = document.getElementById('answerInput');
    const testMode = document.getElementById('testMode');
    const startBtn = document.getElementById('startBtn');
    const submitBtn = document.getElementById('submitBtn');

    let currentTestIndex = -1;
    let realNumbers = {};
    let results = {};
    let currentKey = '';

    startBtn.addEventListener('click', () => {
      document.querySelector('.test').style.display = 'block';
      startBtn.style.display = 'none';
      currentTestIndex = 0;
      realNumbers = {};
      results = {};
      answerInput.value = '';
      answerInput.focus();
      runCurrentTest();
    });

    function nextTest() {
      if (currentTestIndex < tests.length - 1) {
        currentTestIndex += 1;
        answerInput.value = '';
        answerInput.focus();
        runCurrentTest();
      }
    }
    answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    });

    submitBtn.addEventListener('click', () => {
      const answer = answerInput.value.trim();
      if (!currentKey) {
        return;
      }
      if (!/^[0-9]{2}$/.test(answer)) {
        return;
      }
      const expected = realNumbers[currentKey];
      const correct = answer === expected;
      results[currentKey] = correct;

      if (currentTestIndex >= 0 && currentTestIndex < tests.length - 1) {
        nextTest();
      }
      else if (currentTestIndex === tests.length - 1 && tests[currentTestIndex].key === currentKey) {
        const diagnosis = getDiagnosis();
        vscode.postMessage({ type: 'showDiagnosis', diagnosis: diagnosis.msg }); 
        reset();
      }
    });

    function reset() {
      startBtn.style.display = 'block';
      document.querySelector('.test').style.display = 'none';
      currentTestIndex = -1;
      currentKey = '';
      realNumbers = {};
      results = {};
      answerInput.value = '';
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    function runCurrentTest() {
      const test = tests[currentTestIndex];
      generatePlateForMode(test.key, true);
    }

    function generatePlateForMode(key, storeAnswer) {
      currentKey = key;
      if (storeAnswer) {
        realNumbers[key] = String(Math.floor(Math.random() * 90) + 10);
      } else {
        realNumbers[key] = String(Math.floor(Math.random() * 90) + 10);
      }
      const palette = PALETTES[key];
      drawPlate(realNumbers[key], palette);
    }

    function drawPlate(text, palette) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = SIZE;
      maskCanvas.height = SIZE;
      const maskCtx = maskCanvas.getContext('2d');
      maskCtx.fillStyle = BACKGROUND;
      maskCtx.fillRect(0, 0, SIZE, SIZE);
      maskCtx.fillStyle = '#000';
      const fontSize = Math.floor(SIZE * 0.55);
      maskCtx.font = \`bold \${fontSize}px sans-serif\`;
      maskCtx.textAlign = 'center';
      maskCtx.textBaseline = 'middle';
      maskCtx.fillText(text, SIZE / 2, SIZE / 2);

      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, SIZE, SIZE);

      const circles = [];
      const dmin = SIZE / 60;
      const dmax = SIZE / 25;

      for (let i = 0; i < TOTAL_CIRCLES; i += 1) {
        let circle;
        let tries = 0;
        do {
          circle = randomCircle(dmin, dmax);
          tries += 1;
          if (tries > 300) {
            break;
          }
        } while (circles.some((c) => overlap(c, circle)));

        circles.push(circle);
        const pal = touches(maskCtx, circle) ? palette.on : palette.off;
        const color = pal[Math.floor(Math.random() * pal.length)];
        drawCircle(circle, color);
      }
    }

    function randomCircle(dmin, dmax) {
      const r = (Math.random() * (dmax - dmin) + dmin) / 2;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (SIZE * 0.5 - r);
      const x = SIZE / 2 + Math.cos(angle) * dist;
      const y = SIZE / 2 + Math.sin(angle) * dist;
      return { x, y, r };
    }

    function overlap(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < a.r + b.r;
    }

    function touches(maskCtx, circle) {
      const points = [
        { x: circle.x, y: circle.y },
        { x: circle.x + circle.r, y: circle.y },
        { x: circle.x - circle.r, y: circle.y },
        { x: circle.x, y: circle.y + circle.r },
        { x: circle.x, y: circle.y - circle.r }
      ];
      for (const point of points) {
        const px = Math.floor(point.x);
        const py = Math.floor(point.y);
        if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) {
          continue;
        }
        const data = maskCtx.getImageData(px, py, 1, 1).data;
        if (data[0] !== 255 || data[1] !== 255 || data[2] !== 255) {
          return true;
        }
      }
      return false;
    }

    function drawCircle(circle, color) {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    const NORMAL_COLOR_VISION = {"msg": "Normal color vision", "theme_dark": "normal-dark-theme", "theme_light": "normal-light-theme"};
    const VISION_PROBLEM_OR_DISPLAY = {"msg": "Vision problem or display issue (protanopia)", "theme_dark": "protanopia-dark-theme", "theme_light": "protanopia-light-theme"};
    const RED_GREEN_DEFICIENCY = {"msg": "Red-green deficiency (deuteranopia)", "theme_dark": "deuteranopia-dark-theme", "theme_light": "deuteranopia-light-theme"};
    const BLUE_YELLOW_DEFICIENCY = {"msg": "Blue-yellow deficiency (tritanopia)", "theme_dark": "tritanopia-dark-theme", "theme_light": "tritanopia-light-theme"};

    // initialize blank plate
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, SIZE, SIZE);
  </script>
</body>
</html>`;
  }
}
