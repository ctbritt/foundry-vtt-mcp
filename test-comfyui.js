#!/usr/bin/env node

/**
 * Simple test script to verify ComfyUI connectivity and model availability
 */

const axios = require('axios');

const COMFYUI_HOST = process.env.COMFYUI_HOST || '127.0.0.1';
const COMFYUI_PORT = process.env.COMFYUI_PORT || '31411';
const baseUrl = `http://${COMFYUI_HOST}:${COMFYUI_PORT}`;

async function testComfyUI() {
  console.log(`\n🔍 Testing ComfyUI at ${baseUrl}\n`);

  try {
    // Test 1: Check if ComfyUI is responding
    console.log('1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${baseUrl}/system_stats`, { timeout: 5000 });
    console.log('   ✅ ComfyUI is responding');
    console.log(`   Version: ${healthResponse.data.system.comfyui_version}`);
    console.log(`   Python: ${healthResponse.data.system.python_version.split(' ')[0]}`);

    // Test 2: Check available checkpoints
    console.log('\n2. Checking available checkpoint models...');
    const checkpointsResponse = await axios.get(`${baseUrl}/object_info/CheckpointLoaderSimple`);
    const checkpoints = checkpointsResponse.data.CheckpointLoaderSimple.input.required.ckpt_name[0];

    if (checkpoints.length === 0) {
      console.log('   ⚠️  No checkpoint models found!');
      console.log('   Please place checkpoint files in: /home/foundry/ComfyUI/models/checkpoints/');
    } else {
      console.log(`   ✅ Found ${checkpoints.length} checkpoint model(s):`);
      checkpoints.forEach(cp => console.log(`      - ${cp}`));
    }

    // Test 3: Check available VAE models
    console.log('\n3. Checking available VAE models...');
    const vaeResponse = await axios.get(`${baseUrl}/object_info/VAELoader`);
    const vaes = vaeResponse.data.VAELoader.input.required.vae_name[0];

    if (vaes.length === 0 || (vaes.length === 1 && vaes[0] === 'pixel_space')) {
      console.log('   ⚠️  No VAE models found!');
      console.log('   Please place VAE files in: /home/foundry/ComfyUI/models/vae/');
    } else {
      console.log(`   ✅ Found ${vaes.length} VAE model(s):`);
      vaes.forEach(vae => console.log(`      - ${vae}`));
    }

    // Test 4: Submit a test workflow (if models are available)
    if (checkpoints.length > 0 && vaes.length > 1) {
      console.log('\n4. Testing workflow submission...');
      const testWorkflow = {
        "1": {
          "inputs": { "ckpt_name": checkpoints[0] },
          "class_type": "CheckpointLoaderSimple"
        },
        "2": {
          "inputs": {
            "text": "test prompt",
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "3": {
          "inputs": {
            "text": "negative",
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "4": {
          "inputs": { "width": 512, "height": 512, "batch_size": 1 },
          "class_type": "EmptyLatentImage"
        },
        "5": {
          "inputs": {
            "seed": 12345,
            "steps": 1,
            "cfg": 7,
            "denoise": 1,
            "sampler_name": "euler",
            "scheduler": "normal",
            "model": ["1", 0],
            "positive": ["2", 0],
            "negative": ["3", 0],
            "latent_image": ["4", 0]
          },
          "class_type": "KSampler"
        }
      };

      try {
        const workflowResponse = await axios.post(`${baseUrl}/prompt`, {
          prompt: testWorkflow,
          client_id: "test-client"
        });
        console.log('   ✅ Workflow validation passed');
        console.log(`   Job ID: ${workflowResponse.data.prompt_id}`);
      } catch (error) {
        console.log('   ❌ Workflow submission failed:', error.response?.data?.error?.message || error.message);
      }
    } else {
      console.log('\n4. Skipping workflow test (missing required models)');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    if (checkpoints.length > 0 && vaes.length > 1) {
      console.log('✅ ComfyUI is fully operational and ready for map generation!');
    } else {
      console.log('⚠️  ComfyUI is running but needs model files to generate maps.');
      console.log('\nTo fix this:');
      if (checkpoints.length === 0) {
        console.log('1. Download a checkpoint model (e.g., Battlemap_4_400.safetensors)');
        console.log('   and place it in: /home/foundry/ComfyUI/models/checkpoints/');
      }
      if (vaes.length <= 1) {
        console.log('2. Download a VAE model (e.g., sdxl_vae.safetensors)');
        console.log('   and place it in: /home/foundry/ComfyUI/models/vae/');
      }
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error testing ComfyUI:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Cannot connect to ComfyUI. Please ensure:');
      console.error('   1. ComfyUI is running on port', COMFYUI_PORT);
      console.error('   2. The service is accessible at', baseUrl);
    }
    process.exit(1);
  }
}

// Run the test
testComfyUI().catch(console.error);