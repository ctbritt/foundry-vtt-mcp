#!/usr/bin/env node

/**
 * Comprehensive ComfyUI workflow test with the D&D Battlemaps SDXL model
 */

const axios = require('axios');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = '31411';
const baseUrl = `http://${COMFYUI_HOST}:${COMFYUI_PORT}`;

async function testFullWorkflow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  D&D Battlemaps SDXL - Full Workflow Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const clientId = 'test-client-' + Date.now();

  // Workflow matching the MCP server configuration
  const workflow = {
    "1": { // CheckpointLoaderSimple
      "inputs": {
        "ckpt_name": "dDBattlemapsSDXL10_v10.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": { // CLIP Text Encode (Positive)
      "inputs": {
        "text": "2d DnD battlemap of forest clearing with ancient stone circle, moss-covered ruins, small stream, top-down view, overhead perspective, aerial",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": { // CLIP Text Encode (Negative)
      "inputs": {
        "text": "grid, low angle, isometric, oblique, horizon, text, watermark, logo, caption, people, creatures, monsters, blurry, artifacts",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": { // Empty Latent Image
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "5": { // KSampler
      "inputs": {
        "seed": 42,
        "steps": 30,
        "cfg": 2.5,
        "denoise": 1.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      },
      "class_type": "KSampler"
    },
    "9": { // VAE Loader
      "inputs": {
        "vae_name": "sdxl_vae.safetensors"
      },
      "class_type": "VAELoader"
    },
    "6": { // VAE Decode
      "inputs": {
        "samples": ["5", 0],
        "vae": ["9", 0]
      },
      "class_type": "VAEDecode"
    },
    "7": { // Save Image
      "inputs": {
        "filename_prefix": "test_battlemap",
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  };

  try {
    // Test 1: Submit workflow
    console.log('📤 Step 1: Submitting workflow to ComfyUI...');
    const submitResponse = await axios.post(`${baseUrl}/prompt`, {
      prompt: workflow,
      client_id: clientId
    });

    const promptId = submitResponse.data.prompt_id;
    console.log(`   ✅ Workflow submitted successfully`);
    console.log(`   Prompt ID: ${promptId}\n`);

    // Test 2: Wait for completion
    console.log('⏳ Step 2: Waiting for image generation (this may take 1-2 minutes on CPU)...');
    console.log('   Settings:');
    console.log('   - Model: D&D Battlemaps SDXL v1.0');
    console.log('   - Resolution: 1024x1024');
    console.log('   - Steps: 30');
    console.log('   - CFG: 2.5');
    console.log('   - Sampler: DPM++ 2M SDE (Karras)\n');

    let attempts = 0;
    const maxAttempts = 180; // 3 minutes max
    let lastStatus = '';

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check queue status
      try {
        const queueResponse = await axios.get(`${baseUrl}/queue`);
        const queueRunning = queueResponse.data.queue_running || [];
        const queuePending = queueResponse.data.queue_pending || [];

        if (queueRunning.length > 0 || queuePending.length > 0) {
          const newStatus = queueRunning.length > 0 ? 'processing' : 'queued';
          if (newStatus !== lastStatus) {
            console.log(`   Status: ${newStatus}...`);
            lastStatus = newStatus;
          }
        }
      } catch (e) {
        // Queue check failed, continue
      }

      // Check history for completion
      const historyResponse = await axios.get(`${baseUrl}/history/${promptId}`);

      if (historyResponse.data && Object.keys(historyResponse.data).length > 0) {
        console.log('   ✅ Generation completed!\n');

        const jobData = historyResponse.data[promptId];

        // Check for errors
        if (jobData.status && jobData.status.status_str === 'error') {
          console.log('❌ Workflow execution failed!');
          const errorMsg = jobData.status.messages.find(m => m[0] === 'execution_error');
          if (errorMsg) {
            console.log('Error details:');
            console.log(`   Node: ${errorMsg[1].node_type} (${errorMsg[1].node_id})`);
            console.log(`   Error: ${errorMsg[1].exception_message}`);
          }
          process.exit(1);
        }

        // Test 3: Verify outputs
        console.log('📊 Step 3: Verifying outputs...');

        if (!jobData.outputs || Object.keys(jobData.outputs).length === 0) {
          console.log('❌ No outputs found!');
          console.log('Job data:', JSON.stringify(jobData, null, 2));
          process.exit(1);
        }

        // Extract image filenames
        const images = [];
        for (const nodeId of Object.keys(jobData.outputs)) {
          const nodeOutput = jobData.outputs[nodeId];
          if (nodeOutput && nodeOutput.images) {
            for (const image of nodeOutput.images) {
              if (image.filename) {
                images.push(image);
              }
            }
          }
        }

        if (images.length === 0) {
          console.log('❌ No images in outputs!');
          process.exit(1);
        }

        console.log(`   ✅ Found ${images.length} generated image(s):\n`);

        for (const img of images) {
          console.log(`   Image: ${img.filename}`);
          console.log(`   Type: ${img.type || 'output'}`);
          if (img.subfolder) {
            console.log(`   Subfolder: ${img.subfolder}`);
          }
        }

        // Test 4: Verify image file exists
        console.log('\n📁 Step 4: Verifying image file on disk...');
        const fs = require('fs');
        const path = require('path');

        const outputDir = '/home/foundry/ComfyUI/output';
        const imagePath = path.join(outputDir, images[0].filename);

        if (fs.existsSync(imagePath)) {
          const stats = fs.statSync(imagePath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          console.log(`   ✅ Image file exists`);
          console.log(`   Path: ${imagePath}`);
          console.log(`   Size: ${sizeMB} MB\n`);
        } else {
          console.log(`   ❌ Image file not found at: ${imagePath}\n`);
          process.exit(1);
        }

        // Success!
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('  ✅ ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n🎉 ComfyUI is fully operational and ready for map generation!');
        console.log('\nThe MCP bridge can now:');
        console.log('  • Generate D&D battlemaps via Claude Desktop');
        console.log('  • Use the optimized D&D Battlemaps SDXL model');
        console.log('  • Import generated maps directly into Foundry VTT');
        console.log('\nGenerated test image location:');
        console.log(`  ${imagePath}\n`);

        return;
      }

      attempts++;
      if (attempts % 10 === 0) {
        process.stdout.write(`   Still processing... (${attempts}s elapsed)\n`);
      }
    }

    console.log('\n❌ Generation timed out after 3 minutes');
    console.log('This might indicate ComfyUI is processing slowly or encountered an issue.');
    process.exit(1);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.data?.node_errors) {
      console.error('\nNode errors:', JSON.stringify(error.response.data.node_errors, null, 2));
    }
    process.exit(1);
  }
}

testFullWorkflow().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});