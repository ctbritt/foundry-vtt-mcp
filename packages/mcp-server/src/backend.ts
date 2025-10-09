import * as fs from 'fs';

import * as os from 'os';

import * as path from 'path';

import * as net from 'net';

import { spawn, ChildProcess } from 'child_process';

import { config } from './config.js';

import { Logger } from './logger.js';

import { FoundryClient } from './foundry-client.js';

import { CharacterTools } from './tools/character.js';

import { CompendiumTools } from './tools/compendium.js';

import { SceneTools } from './tools/scene.js';

import { ActorCreationTools } from './tools/actor-creation.js';

import { QuestCreationTools } from './tools/quest-creation.js';

import { DiceRollTools } from './tools/dice-roll.js';

import { CampaignManagementTools } from './tools/campaign-management.js';

import { OwnershipTools } from './tools/ownership.js';

import { MapGenerationTools } from './tools/map-generation.js';

const CONTROL_HOST = '127.0.0.1';

const CONTROL_PORT = 31414;

const LOCK_FILE = path.join(os.tmpdir(), 'foundry-mcp-backend.lock');

function getBundledPythonPath(): string {
  const isWindows = os.platform() === 'win32';

  // Detect installation directory based on platform
  let installDir: string;
  if (isWindows) {
    installDir = path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer');
  } else {
    // Linux/Mac: use ~/.local/share or just home directory
    installDir = path.join(os.homedir(), '.local', 'share', 'FoundryMCPServer');
  }

  // Try to detect install directory from current process location
  const currentDir = process.cwd();
  const execDir = path.dirname(process.execPath);

  // Check if we're running from an installed location
  if (currentDir.includes('FoundryMCPServer') || execDir.includes('FoundryMCPServer')) {
    // Extract the installation directory
    const foundryMcpIndex = currentDir.indexOf('FoundryMCPServer');
    if (foundryMcpIndex !== -1) {
      installDir = currentDir.substring(0, foundryMcpIndex + 'FoundryMCPServer'.length);
    } else {
      const foundryMcpExecIndex = execDir.indexOf('FoundryMCPServer');
      if (foundryMcpExecIndex !== -1) {
        installDir = execDir.substring(0, foundryMcpExecIndex + 'FoundryMCPServer'.length);
      }
    }
  }

  const pythonBinary = isWindows ? 'python.exe' : 'python';
  const scriptsDir = isWindows ? 'Scripts' : 'bin';

  // Check for nested ComfyUI installation (Windows portable structure)
  if (isWindows) {
    const nestedComfyUIPythonPath = path.join(installDir, 'ComfyUI', 'ComfyUI', 'python_embeded', pythonBinary);
    if (fs.existsSync(nestedComfyUIPythonPath)) {
      return nestedComfyUIPythonPath;
    }

    // Check for flat ComfyUI portable installation (fallback)
    const portablePythonPath = path.join(installDir, 'ComfyUI', 'python_embeded', pythonBinary);
    if (fs.existsSync(portablePythonPath)) {
      return portablePythonPath;
    }
  }

  // Path to bundled Python virtual environment
  const bundledPythonPath = path.join(installDir, 'ComfyUI-env', scriptsDir, pythonBinary);
  if (fs.existsSync(bundledPythonPath)) {
    return bundledPythonPath;
  }

  // Fallback: try alternative installation paths
  const fallbackPaths: string[] = [];

  if (isWindows) {
    fallbackPaths.push(
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI', 'ComfyUI', 'python_embeded', pythonBinary),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI-headless', 'ComfyUI', 'python_embeded', pythonBinary),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI', 'python_embeded', pythonBinary),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI-headless', 'python_embeded', pythonBinary),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI-env', scriptsDir, pythonBinary),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'Python', pythonBinary)
    );
  } else {
    // Linux/Mac paths
    fallbackPaths.push(
      path.join(os.homedir(), '.local', 'share', 'FoundryMCPServer', 'ComfyUI-env', scriptsDir, pythonBinary),
      path.join(os.homedir(), 'FoundryMCPServer', 'ComfyUI-env', scriptsDir, pythonBinary),
      path.join(os.homedir(), 'comfyui', 'venv', scriptsDir, pythonBinary),
      path.join('/opt', 'FoundryMCPServer', 'ComfyUI-env', scriptsDir, pythonBinary)
    );
  }

  // Common paths for both platforms
  fallbackPaths.push(
    path.join(process.cwd(), '..', '..', 'ComfyUI-env', scriptsDir, pythonBinary)
  );

  for (const fallbackPath of fallbackPaths) {
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
  }

  // Final fallback to system Python
  console.error('Bundled Python not found, falling back to system Python');
  return 'python3';
}


// ComfyUI Service Management

let comfyuiProcess: ChildProcess | null = null;

let comfyuiStatus: 'stopped' | 'starting' | 'running' | 'error' = 'stopped';

let lockFd: number | null = null;

function acquireLock(): boolean {

  try {

    try {

      lockFd = fs.openSync(LOCK_FILE, 'wx');

    } catch (err: any) {

      if (err && err.code === 'EEXIST') {

        try {

          const lockData = fs.readFileSync(LOCK_FILE, 'utf8');

          const lockPid = parseInt(lockData.trim(), 10);

          try {

            process.kill(lockPid, 0);

            console.error(`Backend already running with PID ${lockPid}`);

            return false;

          } catch {

            console.error(`Removing stale backend lock for PID ${lockPid}`);

            try { fs.unlinkSync(LOCK_FILE); } catch {}

            lockFd = fs.openSync(LOCK_FILE, 'wx');

          }

        } catch (readErr) {

          console.error('Corrupt backend lock file, removing:', readErr);

          try { fs.unlinkSync(LOCK_FILE); } catch {}

          lockFd = fs.openSync(LOCK_FILE, 'wx');

        }

      } else {

        console.error('Failed to open backend lock file:', err);

        return false;

      }

    }

    if (lockFd === null) return false;

    fs.writeFileSync(lockFd, String(process.pid));

    try { fs.fsyncSync(lockFd); } catch {}

    console.error(`Acquired backend lock with PID ${process.pid}`);

    return true;

  } catch (error) {

    console.error('Failed to acquire backend lock:', error);

    return false;

  }

}

function releaseLock(): void {

  try {

    if (lockFd !== null) { try { fs.closeSync(lockFd); } catch {} lockFd = null; }

    if (fs.existsSync(LOCK_FILE)) { try { fs.unlinkSync(LOCK_FILE); } catch {} }

  } catch (error) {

    console.error('Failed to release backend lock:', error);

  }

}

// ComfyUI Service Management Functions

async function findComfyUIPath(): Promise<string> {
  const isWindows = os.platform() === 'win32';

  // Check environment variable first
  if (process.env.COMFYUI_PATH) {
    const envPath = process.env.COMFYUI_PATH;
    if (fs.existsSync(path.join(envPath, 'main.py'))) {
      return envPath;
    }
  }

  const searchPaths: string[] = [];

  if (isWindows) {
    // Windows paths
    searchPaths.push(
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI', 'ComfyUI'),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI-headless', 'ComfyUI'),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI'),
      path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI-headless')
    );
  } else {
    // Linux/Mac paths (check both uppercase and lowercase variants)
    searchPaths.push(
      path.join(os.homedir(), 'ComfyUI'),  // Check home directory first
      path.join(os.homedir(), 'comfyui'),
      path.join(os.homedir(), '.local', 'share', 'FoundryMCPServer', 'ComfyUI'),
      path.join(os.homedir(), 'FoundryMCPServer', 'ComfyUI'),
      path.join('/opt', 'FoundryMCPServer', 'ComfyUI'),
      path.join('/opt', 'ComfyUI'),
      path.join('/opt', 'comfyui')
    );
  }

  // Check each path for ComfyUI main.py
  for (const searchPath of searchPaths) {
    if (fs.existsSync(path.join(searchPath, 'main.py'))) {
      return searchPath;
    }
  }

  const legacyFlatPath = searchPaths[searchPaths.length - 1];

  if (fs.existsSync(path.join(legacyFlatPath, 'main.py'))) {

    return legacyFlatPath;

  }

  throw new Error('ComfyUI installation not found');

}

async function waitForComfyUIReady(timeoutMs: number = 60000): Promise<void> {

  const startTime = Date.now();

  // Use configured host and port
  const host = process.env.COMFYUI_HOST || '127.0.0.1';
  const port = process.env.COMFYUI_PORT || '31411';
  const healthUrl = `http://${host}:${port}/system_stats`;

  while (Date.now() - startTime < timeoutMs) {

    try {

      const response = await fetch(healthUrl, {

        signal: AbortSignal.timeout(5000)

      });

      if (response.ok) {

        return; // ComfyUI is ready

      }

    } catch (error) {

      // Still starting up, continue polling

    }

    await new Promise(resolve => setTimeout(resolve, 2000));

  }

  throw new Error('ComfyUI failed to start within timeout');

}

async function startComfyUIService(logger: Logger): Promise<any> {

  if (comfyuiStatus === 'running') {

    return { status: 'already_running', message: 'ComfyUI service is already running' };

  }

  if (comfyuiStatus === 'starting') {

    return { status: 'starting', message: 'ComfyUI service start already in progress' };

  }

  try {

    comfyuiStatus = 'starting';

    logger.info('Starting ComfyUI service...');

    // Find ComfyUI installation

    const comfyUIPath = await findComfyUIPath();

    logger.info('ComfyUI found', { path: comfyUIPath });

    // Spawn ComfyUI process

    logger.info('Starting ComfyUI process', { path: path.join(comfyUIPath, 'main.py') });

    // Use bundled Python virtual environment or ComfyUI's venv
    let pythonExe = getBundledPythonPath();

    // Check if ComfyUI has its own venv (common on Linux)
    const comfyUIVenvPython = path.join(comfyUIPath, 'venv', 'bin', 'python');
    if (fs.existsSync(comfyUIVenvPython)) {
      pythonExe = comfyUIVenvPython;
      logger.info('Using ComfyUI virtual environment Python', { pythonPath: pythonExe });
    } else {
      logger.info('Using bundled Python', { pythonPath: pythonExe });
    }

    // Get listen address from environment or default to 127.0.0.1
    const listenAddress = process.env.COMFYUI_LISTEN || '127.0.0.1';
    const listenPort = process.env.COMFYUI_PORT || '31411';

    comfyuiProcess = spawn(pythonExe, [

      'main.py',

      '--port', listenPort,

      '--listen', listenAddress,

      '--disable-auto-launch',

      '--dont-print-server'

    ], {

      cwd: comfyUIPath,

      stdio: ['ignore', 'pipe', 'pipe'],

      detached: false,

      windowsHide: true // Prevent Python console window on Windows

    });

    // Handle process events

    comfyuiProcess.on('spawn', () => {

      logger.info('ComfyUI process spawned successfully');

    });

    comfyuiProcess.on('error', (error) => {

      logger.error('ComfyUI process error', { error: error.message });

      comfyuiStatus = 'error';

    });

    comfyuiProcess.on('exit', (code, signal) => {

      logger.info('ComfyUI process exited', { code, signal });

      comfyuiStatus = 'stopped';

      comfyuiProcess = null;

    });

    // Capture stdout/stderr for debugging

    comfyuiProcess.stdout?.on('data', (data) => {

      logger.debug('ComfyUI stdout', { data: data.toString().trim() });

    });

    comfyuiProcess.stderr?.on('data', (data) => {

      logger.debug('ComfyUI stderr', { data: data.toString().trim() });

    });

    // Wait for ComfyUI API to be ready

    await waitForComfyUIReady();

    comfyuiStatus = 'running';

    logger.info('ComfyUI service started successfully', {

      pid: comfyuiProcess.pid,

      status: comfyuiStatus

    });

    return {

      status: 'running',

      message: 'ComfyUI service started successfully',

      pid: comfyuiProcess.pid

    };

  } catch (error: any) {

    logger.error('ComfyUI service start failed', { error: error.message });

    comfyuiStatus = 'error';

    if (comfyuiProcess) {

      comfyuiProcess.kill();

      comfyuiProcess = null;

    }

    return {

      status: 'error',

      message: `Failed to start ComfyUI service: ${error.message}`

    };

  }

}

async function stopComfyUIService(logger: Logger): Promise<any> {

  if (comfyuiStatus === 'stopped') {

    return { status: 'already_stopped', message: 'ComfyUI service is already stopped' };

  }

  try {

    logger.info('Stopping ComfyUI service...');

    if (comfyuiProcess) {

      comfyuiProcess.kill('SIGTERM');

      // Wait for graceful shutdown, then force kill if needed

      await new Promise(resolve => setTimeout(resolve, 5000));

      if (comfyuiProcess && !comfyuiProcess.killed) {

        comfyuiProcess.kill('SIGKILL');

      }

    }

    comfyuiStatus = 'stopped';

    comfyuiProcess = null;

    logger.info('ComfyUI service stopped successfully');

    return { status: 'stopped', message: 'ComfyUI service stopped successfully' };

  } catch (error: any) {

    logger.error('ComfyUI service stop failed', { error: error.message });

    return { status: 'error', message: `Failed to stop ComfyUI service: ${error.message}` };

  }

}

async function checkComfyUIStatus(): Promise<any> {

  // Check process status first

  if (!comfyuiProcess || comfyuiProcess.killed) {

    comfyuiStatus = 'stopped';

  }

  // If status shows running, verify API is actually responsive

  if (comfyuiStatus === 'running') {

    try {

      // Use configured host and port
      const host = process.env.COMFYUI_HOST || '127.0.0.1';
      const port = process.env.COMFYUI_PORT || '31411';
      const healthUrl = `http://${host}:${port}/system_stats`;

      const response = await fetch(healthUrl, {

        signal: AbortSignal.timeout(5000)

      });

      if (!response.ok) {

        comfyuiStatus = 'error';

      }

    } catch (error) {

      comfyuiStatus = 'error';

    }

  }

  return {

    status: comfyuiStatus,

    message: getStatusMessage(comfyuiStatus),

    pid: comfyuiProcess?.pid || null

  };

}

function getStatusMessage(status: string): string {

  const statusMessages = {

    'stopped': 'ComfyUI service is not running',

    'starting': 'ComfyUI service is starting...',

    'running': 'ComfyUI service is running',

    'error': 'ComfyUI service encountered an error'

  };

  return statusMessages[status as keyof typeof statusMessages] || 'Unknown status';

}

// Map generation WebSocket handlers (matching existing tool pattern)
async function handleGenerateMapRequest(message: any, jobQueue: any, comfyuiClient: any, logger: Logger, foundryClient: any): Promise<any> {
  try {
    logger.info('Map generation request received via WebSocket', { message });

    if (!jobQueue || !comfyuiClient) {
      throw new Error('Map generation components not initialized');
    }

    // Extract data from message - could be in message.data or message directly
    const data = message.data || message;

    // Validate input
    if (!data.prompt || typeof data.prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (!data.scene_name || typeof data.scene_name !== 'string') {
      throw new Error('Scene name is required and must be a string');
    }

    const params = {
      prompt: data.prompt.trim(),
      scene_name: data.scene_name.trim(),
      size: data.size || 'medium',
      grid_size: data.grid_size || 70
    };

    // Create job using mapgen's JobQueue
    const job = await jobQueue.createJob({ params });
    const jobId = job.id;

    // Start background processing (mapgen style)
    processMapGenerationInBackend(jobId, jobQueue, comfyuiClient, logger, foundryClient).catch((error) => {
      logger.error('Background map generation failed', { jobId, error });
    });

    return {
      status: 'success',
      jobId: jobId,
      message: 'Map generation started',
      estimatedTime: '30-90 seconds'
    };

  } catch (error: any) {
    logger.error('Map generation request failed', { error: error.message });
    return {
      status: 'error',
      message: error.message
    };
  }
}

async function handleCheckMapStatusRequest(data: any, jobQueue: any, logger: Logger): Promise<any> {
  try {
    if (!data) {
      throw new Error('Request data is required');
    }
    const jobId = data.job_id;
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const job = await jobQueue.getJob(jobId);
    if (!job) {
      return {
        status: 'error',
        message: `Job ${jobId} not found`
      };
    }

    return {
      status: 'success',
      job: {
        id: job.id,
        status: job.status,
        progress_percent: job.progress_percent,
        current_stage: job.current_stage,
        result: job.result,
        error: job.error
      }
    };

  } catch (error: any) {
    logger.error('Map status check failed', { error: error.message });
    return {
      status: 'error',
      message: error.message
    };
  }
}

async function handleCancelMapJobRequest(data: any, jobQueue: any, logger: Logger): Promise<any> {
  try {
    if (!data) {
      throw new Error('Request data is required');
    }
    const jobId = data.job_id;
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const cancelled = await jobQueue.cancelJob(jobId);

    return {
      status: cancelled ? 'success' : 'error',
      message: cancelled ? 'Job cancelled successfully' : 'Failed to cancel job'
    };

  } catch (error: any) {
    logger.error('Map job cancellation failed', { error: error.message });
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Background processing using mapgen's proven approach
async function processMapGenerationInBackend(jobId: string, jobQueue: any, comfyuiClient: any, logger: Logger, foundryClient: any): Promise<void> {
  // CRITICAL: Log entry to file IMMEDIATELY
  const fs2 = await import('fs').then(m => m.promises);
  const path2 = await import('path');
  const os2 = await import('os');
  const processDebugLog = path2.join(os2.tmpdir(), 'process-mapgen-debug.log');
  await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] processMapGenerationInBackend ENTERED - jobId: ${jobId}\n`);

  try {
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Getting job from queue...\n`);
    const job = await jobQueue.getJob(jobId);
    if (!job) {
      await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] ERROR: Job not found!\n`);
      throw new Error(`Job ${jobId} not found`);
    }

    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Job retrieved: ${JSON.stringify(job.params)}\n`);
    logger.info('Starting background map generation processing', { jobId, params: job.params });

    // Mark job as started (mapgen style)
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Marking job as started...\n`);
    await jobQueue.markJobStarted(jobId);
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Job marked as started\n`);

    // Emit progress to Foundry module
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Sending initial progress...\n`);
    foundryClient.sendMessage({
      type: 'map-generation-progress',
      jobId: jobId,
      progress: 10,
      stage: 'Starting processing...'
    });

    // Ensure ComfyUI is running
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Checking ComfyUI health...\n`);
    const healthInfo = await comfyuiClient.checkHealth();
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Health check: ${JSON.stringify(healthInfo)}\n`);
    if (!healthInfo.available) {
      await comfyuiClient.startService();
    }

    await jobQueue.updateJobProgress(jobId, 25, 'Submitting to ComfyUI...');
    foundryClient.sendMessage({
      type: 'map-generation-progress',
      jobId: jobId,
      progress: 25,
      stage: 'Submitting to ComfyUI...'
    });

    // Submit to ComfyUI (using mapgen's client)
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Submitting job to ComfyUI...\n`);
    const sizePixels = comfyuiClient.getSizePixels(job.params.size as any);
    const comfyuiJob = await comfyuiClient.submitJob({
      prompt: job.params.prompt,
      width: sizePixels,
      height: sizePixels
    });
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] ComfyUI job submitted: ${comfyuiJob.prompt_id}\n`);

    // Wait for completion (mapgen style)
    await jobQueue.updateJobProgress(jobId, 50, 'Generating battlemap...');
    foundryClient.sendMessage({
      type: 'map-generation-progress',
      jobId: jobId,
      progress: 50,
      stage: 'Generating battlemap...'
    });

    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Starting status polling...\n`);
    let status = await comfyuiClient.getJobStatus(comfyuiJob.prompt_id);
    logger.info('Initial job status', { jobId, promptId: comfyuiJob.prompt_id, status });
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Initial status: ${status}\n`);

    let pollCount = 0;
    while (status === 'queued' || status === 'running') {
      pollCount++;
      logger.info('Polling job status', { jobId, promptId: comfyuiJob.prompt_id, pollCount, currentStatus: status });

      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await comfyuiClient.getJobStatus(comfyuiJob.prompt_id);

      logger.info('Job status after poll', { jobId, promptId: comfyuiJob.prompt_id, pollCount, newStatus: status });

      if (status === 'running') {
        await jobQueue.updateJobProgress(jobId, 70, 'AI generating battlemap...');
        foundryClient.sendMessage({
          type: 'map-generation-progress',
          jobId: jobId,
          progress: 70,
          stage: 'AI generating battlemap...'
        });
      }
    }

    logger.info('Job polling completed', { jobId, promptId: comfyuiJob.prompt_id, finalStatus: status, totalPolls: pollCount });
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Polling complete, status: ${status}\n`);

    if (status === 'failed') {
      throw new Error('ComfyUI generation failed');
    }

    // Download and save the generated image (like mapgen does)
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Getting job images...\n`);
    await jobQueue.updateJobProgress(jobId, 85, 'Downloading image...');

    // Get the generated image filenames from ComfyUI history
    const imageFilenames = await comfyuiClient.getJobImages(comfyuiJob.prompt_id);
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Images: ${JSON.stringify(imageFilenames)}\n`);
    if (!imageFilenames || imageFilenames.length === 0) {
      throw new Error('No images found in ComfyUI job output');
    }

    // Download the first generated image
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Downloading image: ${imageFilenames[0]}\n`);
    const firstImageFilename = imageFilenames[0];
    const imageBuffer = await comfyuiClient.downloadImage(firstImageFilename);
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Downloaded, buffer size: ${imageBuffer?.length || 0}\n`);
    if (!imageBuffer) {
      throw new Error(`Failed to download generated image: ${firstImageFilename}`);
    }

    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Updating progress to 90%...\n`);
    await jobQueue.updateJobProgress(jobId, 90, 'Saving image...');
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Progress updated\n`);

    // Save image to Foundry-accessible location
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] About to import fs/path/os for upload...\n`);
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const os = await import('os');
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Imports complete\n`);

    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Creating filename and checking connection type...\n`);
    const timestamp = Date.now();
    const filename = `map_${jobId}_${timestamp}.png`;
    let webPath: string;

    // ALWAYS upload images via Foundry query instead of direct filesystem write
    // Reason: MCP server and Foundry may be on different machines or have different paths
    // The Foundry module's upload handler knows the correct local path
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] foundryClient exists: ${!!foundryClient}, type: ${typeof foundryClient}\n`);
    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] About to call getConnectionType()...\n`);
    let connectionType: 'websocket' | 'webrtc' | null = null;
    try {
      connectionType = foundryClient.getConnectionType();
      await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] getConnectionType() returned: ${connectionType}\n`);
    } catch (err) {
      await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] getConnectionType() threw error: ${err}\n`);
      connectionType = 'webrtc'; // Assume WebRTC since we're here
    }

    await fs2.appendFile(processDebugLog, `[${new Date().toISOString()}] Using upload method for all connections\n`);

    // ALWAYS write debug log to trace execution
    const debugLog = async (msg: string) => {
      const logPath = path.join(os.tmpdir(), 'foundry-mcp-upload-debug.log');
      await fs.appendFile(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    };

    await debugLog(`=== MAP GENERATION DEBUG START ===`);
    await debugLog(`JobId: ${jobId}, Filename: ${filename}`);
    await debugLog(`Connection type: ${connectionType}`);
    await debugLog(`Image size: ${imageBuffer.length} bytes`);
    await debugLog(`Using upload method (always) - imageSize: ${imageBuffer.length} bytes`);

    // Convert image buffer to base64 for transmission
    const base64Image = imageBuffer.toString('base64');
    await debugLog(`Base64 conversion complete - size: ${base64Image.length} bytes (${(base64Image.length / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to Foundry via WebRTC/WebSocket query
    // The Foundry module's upload handler knows the correct local path
    await debugLog('Sending upload query to Foundry...');

    let uploadResult: any;
    try {
      uploadResult = await foundryClient.query('foundry-mcp-bridge.upload-generated-map', {
        filename: filename,
        imageData: base64Image
      });

      await debugLog(`Upload query completed - success: ${uploadResult.success}`);

      if (!uploadResult.success) {
        await debugLog(`Upload failed - error: ${uploadResult.error}`);
        throw new Error(`Failed to upload image to Foundry: ${uploadResult.error}`);
      }
    } catch (error) {
      await debugLog(`Upload exception: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    webPath = uploadResult.path;
    logger.info('Image uploaded successfully to Foundry', { path: webPath });

    await jobQueue.updateJobProgress(jobId, 95, 'Creating scene data...');

    // Create scene data payload (simplified version of mapgen's FoundryIntegrator)
    const sceneSize = comfyuiClient.getSizePixels(job.params.size as any);
    // Debug: Log what we received
    logger.info('Job params received', {
      scene_name: job.params.scene_name,
      prompt: job.params.prompt,
      all_params: job.params
    });

    if (!job.params.scene_name) {
      throw new Error(`Scene name missing from job params. Received params: ${JSON.stringify(job.params)}`);
    }

    const sceneName = job.params.scene_name.trim();
    logger.info('Using scene name', { scene_name: sceneName });
    const sceneData = {
      name: sceneName,
      img: webPath,
      background: { src: webPath }, // Foundry v13 compatibility
      width: sceneSize,
      height: sceneSize,
      padding: 0.25,
      initial: {
        x: sceneSize / 2,
        y: sceneSize / 2,
        scale: 1
      },
      backgroundColor: "#999999",
      grid: {
        type: 1, // CONST.GRID_TYPES.SQUARE
        size: job.params.grid_size || 100,
        color: "#000000",
        alpha: 0.2,
        distance: 5,
        units: "ft"
      },
      tokenVision: true,
      fogExploration: true,
      fogReset: Date.now(),
      globalLight: false,
      darkness: 0,
      navigation: true,
      active: false,
      permission: {
        default: 2 // CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
      },
      walls: [] // Could add wall detection here later
    };

    // Mark job as complete with full result data
    await jobQueue.updateJobProgress(jobId, 100, 'Complete');
    await jobQueue.markJobComplete(jobId, {
      generation_time_ms: Date.now() - (job.started_at || job.created_at),
      image_url: webPath,
      foundry_scene_payload: sceneData
    });

    // Broadcast completion with scene data (like mapgen does)
    foundryClient.broadcastMessage({
      type: 'job-completed', // Use mapgen's message type
      jobId: jobId,
      data: {
        status: 'completed',
        result: sceneData, // Complete scene payload
        image_path: webPath,
        prompt: job.params.prompt
      }
    });

    logger.info('Map generation completed successfully', { jobId });

  } catch (error: any) {
    logger.error('Background map generation processing failed', { jobId, error });
    await jobQueue.markJobFailed(jobId, error.message);

    // Emit failure to Foundry module
    foundryClient.sendMessage({
      type: 'map-generation-failed',
      jobId: jobId,
      error: error.message
    });
  }
}

async function startBackend(): Promise<void> {

  // Logger: file output allowed; avoid stdout noise

  const logger = new Logger({

    level: config.logLevel,

    format: config.logFormat,

    enableConsole: false,

    enableFile: true,

    filePath: path.join(os.tmpdir(), 'foundry-mcp-server', 'mcp-server.log'),

  });

  logger.info('Starting Foundry MCP Backend', {

    version: config.server.version,

    foundryHost: config.foundry.host,

    foundryPort: config.foundry.port,

  });

  // Initialize Foundry client and tools

  const foundryClient = new FoundryClient(config.foundry, logger);

  const characterTools = new CharacterTools({ foundryClient, logger });

  const compendiumTools = new CompendiumTools({ foundryClient, logger });

  const sceneTools = new SceneTools({ foundryClient, logger });

  const actorCreationTools = new ActorCreationTools({ foundryClient, logger });

  const questCreationTools = new QuestCreationTools({ foundryClient, logger });

  const diceRollTools = new DiceRollTools({ foundryClient, logger });

  const campaignManagementTools = new CampaignManagementTools(foundryClient, logger);

  const ownershipTools = new OwnershipTools({ foundryClient, logger });

  // Initialize mapgen-style backend components for map generation
  let mapGenerationJobQueue: any = null;
  let mapGenerationComfyUIClient: any = null;

  try {
    // Import and initialize job queue and ComfyUI client
    const { JobQueue } = await import('./job-queue.js');
    const { ComfyUIClient } = await import('./comfyui-client.js');

    mapGenerationJobQueue = new JobQueue({ logger });

    // Initialize ComfyUI client - respects environment configuration
    mapGenerationComfyUIClient = new ComfyUIClient({
      logger,
      config: {
        host: process.env.COMFYUI_HOST || '127.0.0.1',
        port: config.comfyui?.port || parseInt(process.env.COMFYUI_PORT || '31411', 10),
        installPath: process.env.COMFYUI_PATH || undefined
      }
    });

    logger.info('Map generation backend components initialized (ComfyUI on localhost:31411)');
  } catch (error) {
    logger.warn('Failed to initialize map generation components', { error });
  }

  // Set up global ComfyUI message handlers for WebSocket messages from Foundry BEFORE creating map tools

  (globalThis as any).backendComfyUIHandlers = {

    handleMessage: async (message: any) => {
      // CRITICAL DEBUG: Write to file IMMEDIATELY when this function is called
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      const os = await import('os');
      const debugLog = path.join(os.tmpdir(), 'backend-handler-debug.log');
      await fs.appendFile(debugLog, `[${new Date().toISOString()}] handleMessage called - type: ${message?.type}, requestId: ${message?.requestId}\n`);

      logger.info('Handling ComfyUI message', {

        requestId: message.requestId,

        type: message.type,

        hasData: !!message.data

      });

      try {
        // Debug: Log before switch
        const fs = await import('fs').then(m => m.promises);
        const path = await import('path');
        const os = await import('os');
        const debugLog = path.join(os.tmpdir(), 'backend-handler-debug.log');
        await fs.appendFile(debugLog, `[${new Date().toISOString()}] About to switch on message.type: "${message.type}"\n`);

        let result: any;

        switch (message.type) {

          case 'start-comfyui-service':

            result = await startComfyUIService(logger);

            break;

          case 'stop-comfyui-service':

            result = await stopComfyUIService(logger);

            break;

          case 'check-comfyui-status':

            result = await checkComfyUIStatus();

            break;

          // Map generation handlers (following existing tool pattern)
          case 'generate-map-request':
            await fs.appendFile(debugLog, `[${new Date().toISOString()}] Matched generate-map-request case, calling handler...\n`);
            result = await handleGenerateMapRequest(message, mapGenerationJobQueue, mapGenerationComfyUIClient, logger, foundryClient);
            await fs.appendFile(debugLog, `[${new Date().toISOString()}] Handler returned: ${JSON.stringify(result)}\n`);
            break;

          case 'check-map-status-request':

            result = await handleCheckMapStatusRequest(message.data, mapGenerationJobQueue, logger);

            break;

          case 'cancel-map-job-request':

            result = await handleCancelMapJobRequest(message.data, mapGenerationJobQueue, logger);

            break;

          default:

            logger.warn('Unknown ComfyUI message type', { type: message.type });

            result = { status: 'error', message: `Unknown message type: ${message.type}` };

        }

        // Send response back through foundryClient if requestId is provided

        if (message.requestId && foundryClient) {

          const response = {

            type: `${message.type}-response`,

            requestId: message.requestId,

            ...result

          };

          // Send response to Foundry via WebSocket

          try {

            foundryClient.sendMessage(response);

          } catch (error) {

            logger.error('Failed to send ComfyUI response to Foundry', { error, response });

          }

        }

        return result;

      } catch (error: any) {

        logger.error('ComfyUI message handling failed', {

          requestId: message.requestId,

          type: message.type,

          error: error.message

        });

        const errorResult = {

          status: 'error',

          message: error.message

        };

        // Send error response if requestId provided

        if (message.requestId && foundryClient) {

          try {

            foundryClient.sendMessage({

              type: `${message.type}-response`,

              requestId: message.requestId,

              ...errorResult

            });

          } catch (sendError) {

            logger.error('Failed to send ComfyUI error response', { sendError });

          }

        }

        return errorResult;

      }

    }

  };

  // Now create MapGenerationTools with the handlers available

  const mapGenerationTools = new MapGenerationTools({
    foundryClient,
    logger,
    backendComfyUIHandlers: (globalThis as any).backendComfyUIHandlers
  });

  const allTools = [

    ...characterTools.getToolDefinitions(),

    ...compendiumTools.getToolDefinitions(),

    ...sceneTools.getToolDefinitions(),

    ...actorCreationTools.getToolDefinitions(),

    ...questCreationTools.getToolDefinitions(),

    ...diceRollTools.getToolDefinitions(),

    ...campaignManagementTools.getToolDefinitions(),

    ...ownershipTools.getToolDefinitions(),

    ...mapGenerationTools.getToolDefinitions(),

  ];

  // Start Foundry connector (owns app port 31415)

  foundryClient.connect().catch((e) => {

    logger.error('Foundry connector failed to start', e);

  });

  const autoStartComfyUI = async () => {

    try {

      logger.info('Auto-starting ComfyUI service...');

      const result = await startComfyUIService(logger);

      logger.info('ComfyUI auto-start result', result);

    } catch (error: any) {

      logger.warn('ComfyUI auto-start failed', {

        error: error instanceof Error ? error.message : String(error)

      });

      // Don't throw - backend should continue even if ComfyUI fails to start

    }

  };

  // Control channel (TCP JSON-lines)

  const server = net.createServer((socket) => {

    socket.setEncoding('utf8');

    let buffer = '';

    socket.on('data', async (chunk: string) => {

      buffer += chunk;

      let idx: number;

      while ((idx = buffer.indexOf('\n')) >= 0) {

        const line = buffer.slice(0, idx).trim();

        buffer = buffer.slice(idx + 1);

        if (!line) continue;

        try {

          const msg = JSON.parse(line) as { id: string; method: string; params?: any };

          if (msg.method === 'ping') {

            socket.write(JSON.stringify({ id: msg.id, result: { ok: true } }) + '\n');

            continue;

          }

          if (msg.method === 'list_tools') {

            socket.write(JSON.stringify({ id: msg.id, result: { tools: allTools } }) + '\n');

            continue;

          }

          if (msg.method === 'call_tool') {

            const { name, args } = (msg.params || {}) as { name: string; args?: any };

            try {

              let result: any;

              switch (name) {

                // Character tools

                case 'get-character':

                  result = await characterTools.handleGetCharacter(args);

                  break;

                case 'list-characters':

                  result = await characterTools.handleListCharacters(args);

                  break;

                // Compendium tools

                case 'search-compendium':

                  result = await compendiumTools.handleSearchCompendium(args);

                  break;

                case 'get-compendium-item':

                  result = await compendiumTools.handleGetCompendiumItem(args);

                  break;

                case 'list-creatures-by-criteria':

                  result = await compendiumTools.handleListCreaturesByCriteria(args);

                  break;

                case 'list-compendium-packs':

                  result = await compendiumTools.handleListCompendiumPacks(args);

                  break;

                // Scene tools

                case 'get-current-scene':

                  result = await sceneTools.handleGetCurrentScene(args);

                  break;

                case 'get-world-info':

                  result = await sceneTools.handleGetWorldInfo(args);

                  break;

                // Actor creation tools

                case 'create-actor-from-compendium':

                  result = await actorCreationTools.handleCreateActorFromCompendium(args);

                  break;

                case 'get-compendium-entry-full':

                  result = await actorCreationTools.handleGetCompendiumEntryFull(args);

                  break;

                // Quest creation tools

                case 'create-quest-journal':

                  result = await questCreationTools.handleCreateQuestJournal(args);

                  break;

                case 'link-quest-to-npc':

                  result = await questCreationTools.handleLinkQuestToNPC(args);

                  break;

                case 'update-quest-journal':

                  result = await questCreationTools.handleUpdateQuestJournal(args);

                  break;

                case 'list-journals':

                  result = await questCreationTools.handleListJournals(args);

                  break;

                case 'search-journals':

                  result = await questCreationTools.handleSearchJournals(args);

                  break;

                // Dice roll tools

                case 'request-player-rolls':

                  result = await diceRollTools.handleRequestPlayerRolls(args);

                  break;

                // Campaign management tools

                case 'create-campaign-dashboard':

                  result = await campaignManagementTools.handleCreateCampaignDashboard(args);

                  break;

                // Ownership tools

                case 'assign-actor-ownership':

                  result = await ownershipTools.handleToolCall('assign-actor-ownership', args);

                  break;

                case 'remove-actor-ownership':

                  result = await ownershipTools.handleToolCall('remove-actor-ownership', args);

                  break;

                case 'list-actor-ownership':

                  result = await ownershipTools.handleToolCall('list-actor-ownership', args);

                  break;

                // Map generation tools

                case 'generate-map':

                  result = await mapGenerationTools.generateMap(args);

                  break;

                case 'check-map-status':

                  result = await mapGenerationTools.checkMapStatus(args);

                  break;

                case 'cancel-map-job':

                  result = await mapGenerationTools.cancelMapJob(args);

                  break;

                case 'list-scenes':

                  result = await mapGenerationTools.listScenes(args);

                  break;

                case 'switch-scene':

                  result = await mapGenerationTools.switchScene(args);

                  break;

                default:

                  throw new Error(`Unknown tool: ${name}`);

              }

              const payload = {

                content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }],

              };

              socket.write(JSON.stringify({ id: msg.id, result: payload }) + '\n');

            } catch (e: any) {

              const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';

              socket.write(

                JSON.stringify({ id: msg.id, result: { content: [{ type: 'text', text: `Error: ${errorMessage}` }], isError: true } }) + '\n'

              );

            }

            continue;

          }

          // Unknown method

          socket.write(JSON.stringify({ id: msg.id, error: { message: 'Unknown method' } }) + '\n');

        } catch (e: any) {

          try { socket.write(JSON.stringify({ error: { message: e?.message || 'Bad request' } }) + '\n'); } catch {}

        }

      }

    });

  });

  await new Promise<void>((resolve, reject) => {

    server.listen(CONTROL_PORT, CONTROL_HOST, () => {

      logger.info(`Backend control channel listening on ${CONTROL_HOST}:${CONTROL_PORT}`);

      resolve();

    });

    server.on('error', reject);

  });

  void autoStartComfyUI();

  // Shutdown hooks

  process.on('SIGINT', () => { foundryClient.disconnect(); releaseLock(); process.exit(0); });

  process.on('SIGTERM', () => { foundryClient.disconnect(); releaseLock(); process.exit(0); });

}

(async function main() {

  if (!acquireLock()) process.exit(0);

  process.on('exit', releaseLock);

  try {

    await startBackend();

  } catch (e: any) {

    console.error('Failed to start backend:', e?.message || e);

    releaseLock();

    process.exit(1);

  }

})();
