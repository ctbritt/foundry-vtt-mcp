/**
 * Test script for remote ComfyUI integration
 * Run with: npm run test-remote
 */

import { ComfyUIProviderManager, ComfyUIProvider } from './comfyui-provider-manager.js';
import { ComfyUIClient } from './comfyui-client.js';
import { Logger } from './logger.js';

// Test configuration
const testProviders: ComfyUIProvider[] = [
  {
    name: 'comfyai-run-test',
    url: 'https://comfyai.run/api/v1',
    apiKey: process.env.COMFYAI_RUN_API_KEY,
    priority: 10,
    enabled: true,
    timeout: 120000,
    retryAttempts: 2
  },
  {
    name: 'local-test',
    url: 'http://127.0.0.1:8188',
    priority: 1,
    enabled: true,
    timeout: 60000,
    retryAttempts: 1
  }
];

async function testRemoteComfyUI() {
  const logger = new Logger({
    level: 'info',
    format: 'simple',
    enableConsole: true,
    enableFile: false
  });

  console.log('🧪 Testing Remote ComfyUI Integration\n');

  // Test 1: Provider Manager
  console.log('1. Testing Provider Manager...');
  const providerManager = new ComfyUIProviderManager({
    logger,
    providers: testProviders
  });

  // Wait for initial health checks
  await new Promise(resolve => setTimeout(resolve, 5000));

  const healthStatus = providerManager.getHealthStatus();
  console.log('Provider Health Status:');
  for (const [name, health] of healthStatus) {
    console.log(`  ${name}: ${health.available ? '✅ Available' : '❌ Unavailable'} (${health.responseTime}ms)`);
  }

  const activeProvider = await providerManager.getActiveProvider();
  console.log(`Active Provider: ${activeProvider?.name || 'None'}\n`);

  // Test 2: ComfyUI Client with Auto Mode
  console.log('2. Testing ComfyUI Client with Auto Mode...');
  const comfyuiClient = new ComfyUIClient({
    logger,
    mode: 'auto',
    config: {
      providers: testProviders,
      fallbackToLocal: true,
      mode: 'auto'
    }
  });

  // Test health check
  const health = await comfyuiClient.checkHealth();
  console.log(`ComfyUI Health: ${health.available ? '✅ Available' : '❌ Unavailable'}`);
  if (health.gpuInfo) {
    console.log(`GPU Info: ${health.gpuInfo}`);
  }

  // Test 3: Job Submission (if available)
  if (health.available) {
    console.log('\n3. Testing Job Submission...');
    try {
      const jobResponse = await comfyuiClient.submitJob({
        prompt: 'test battlemap',
        width: 1024,
        height: 1024,
        seed: 12345
      });
      console.log(`✅ Job submitted: ${jobResponse.prompt_id}`);

      // Wait a bit and check status
      await new Promise(resolve => setTimeout(resolve, 2000));
      const status = await comfyuiClient.getJobStatus(jobResponse.prompt_id);
      console.log(`Job Status: ${status}`);

      if (status === 'complete') {
        const images = await comfyuiClient.getJobImages(jobResponse.prompt_id);
        console.log(`Generated Images: ${images.length}`);
      }
    } catch (error) {
      console.log(`❌ Job submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cleanup
  await comfyuiClient.shutdown();
  await providerManager.shutdown();

  console.log('\n✅ Test completed!');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testRemoteComfyUI().catch(console.error);
}

export { testRemoteComfyUI };