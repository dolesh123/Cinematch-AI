const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT_DIR = path.resolve(__dirname, '../../');
const VENV_PYTHON_WIN = path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe');
const VENV_PYTHON_UNIX = path.join(ROOT_DIR, 'venv', 'bin', 'python');
const ML_BRIDGE_SCRIPT = path.join(ROOT_DIR, 'backend', 'ml', 'ml_bridge.py');
const ML_DAEMON_SCRIPT = path.join(ROOT_DIR, 'backend', 'ml', 'ml_daemon.py');

const DAEMON_PORT = 8001;
let daemonProcess = null;
let daemonReady = false;

function getPythonExecutable() {
  if (fs.existsSync(VENV_PYTHON_WIN)) {
    return VENV_PYTHON_WIN;
  }
  if (fs.existsSync(VENV_PYTHON_UNIX)) {
    return VENV_PYTHON_UNIX;
  }
  return 'python';
}

function startMLDaemon() {
  if (daemonProcess) return;

  const pythonExe = getPythonExecutable();
  try {
    daemonProcess = spawn(pythonExe, [ML_DAEMON_SCRIPT], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        PYTHONPATH: path.join(ROOT_DIR, 'backend'),
        PYTHONIOENCODING: 'utf-8',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    daemonProcess.stdout.on('data', (data) => {
      const msg = data.toString('utf-8');
      if (msg.includes('Running high-speed warm ML daemon') || msg.includes('Ready for instant inference')) {
        daemonReady = true;
      }
    });

    daemonProcess.on('exit', () => {
      daemonProcess = null;
      daemonReady = false;
    });
  } catch (err) {
    console.warn(`[ML Daemon Notice]: ${err.message}`);
  }
}

// Auto-start warm daemon on module load
startMLDaemon();

function requestDaemon(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const options = {
      hostname: '127.0.0.1',
      port: DAEMON_PORT,
      path: endpoint,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
      },
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML Daemon request timed out'));
    });

    if (payload) {
      req.write(dataStr);
    }
    req.end();
  });
}

function runCLIBridgeFallback(argsObj) {
  return new Promise((resolve) => {
    const pythonExe = getPythonExecutable();
    const inputJson = JSON.stringify(argsObj);

    const child = spawn(pythonExe, [ML_BRIDGE_SCRIPT, '--input_json', inputJson], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        PYTHONPATH: path.join(ROOT_DIR, 'backend'),
        PYTHONIOENCODING: 'utf-8',
      },
    });

    let stdoutData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString('utf-8');
    });

    child.on('close', (code) => {
      try {
        const trimmed = stdoutData.trim();
        const jsonStart = trimmed.indexOf('[');
        const jsonObjStart = trimmed.indexOf('{');

        let targetStart = -1;
        if (jsonStart !== -1 && jsonObjStart !== -1) {
          targetStart = Math.min(jsonStart, jsonObjStart);
        } else if (jsonStart !== -1) {
          targetStart = jsonStart;
        } else {
          targetStart = jsonObjStart;
        }

        if (targetStart === -1) return resolve([]);
        const jsonStr = trimmed.substring(targetStart);
        resolve(JSON.parse(jsonStr));
      } catch (err) {
        resolve([]);
      }
    });

    child.on('error', () => {
      resolve([]);
    });
  });
}

async function runMLBridge(argsObj) {
  // 1. Ultra-fast path: Warm in-memory Python ML Daemon (~15ms)
  try {
    if (argsObj.task === 'evaluate') {
      return await requestDaemon('/evaluate');
    } else {
      return await requestDaemon('/recommend', argsObj);
    }
  } catch (daemonErr) {
    // 2. Fallback path if daemon is still warming up
    if (!daemonProcess) {
      startMLDaemon();
    }
    return await runCLIBridgeFallback(argsObj);
  }
}

module.exports = {
  runMLBridge,
  startMLDaemon,
};
