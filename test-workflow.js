#!/usr/bin/env node

const axios = require('axios');

async function testWorkflow() {
  const baseUrl = 'http://127.0.0.1:31411';
  const clientId = 'test-client-' + Date.now();

  console.log('Testing ComfyUI workflow submission...\n');

  // Simple test workflow
  const workflow = {
    "1": { // CheckpointLoaderSimple
      "inputs": {
        "ckpt_name": "Battlemap_4_400.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": { // CLIP Text Encode (Positive)
      "inputs": {
        "text": "2d DnD battlemap of a simple tavern interior, top-down view",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": { // CLIP Text Encode (Negative)
      "inputs": {
        "text": "blurry, low quality",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": { // Empty Latent Image
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "5": { // KSampler
      "inputs": {
        "seed": 42,
        "steps": 20,
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
    // Submit the workflow
    console.log('1. Submitting workflow...');
    const submitResponse = await axios.post(`${baseUrl}/prompt`, {
      prompt: workflow,
      client_id: clientId
    });

    const promptId = submitResponse.data.prompt_id;
    console.log(`   ✅ Workflow submitted, prompt_id: ${promptId}`);

    // Wait a moment for processing
    console.log('\n2. Waiting for job to complete...');
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check history
      const historyResponse = await axios.get(`${baseUrl}/history/${promptId}`);

      if (historyResponse.data && Object.keys(historyResponse.data).length > 0) {
        console.log('   ✅ Job completed!');

        const jobData = historyResponse.data[promptId];
        console.log('\n3. Job outputs:');
        console.log(JSON.stringify(jobData.outputs, null, 2));

        // Extract image filenames
        const images = [];
        if (jobData.outputs) {
          for (const nodeId of Object.keys(jobData.outputs)) {
            const nodeOutput = jobData.outputs[nodeId];
            if (nodeOutput && nodeOutput.images) {
              for (const image of nodeOutput.images) {
                if (image.filename) {
                  images.push(image.filename);
                }
              }
            }
          }
        }

        if (images.length > 0) {
          console.log('\n✅ Images generated successfully:');
          images.forEach(img => console.log(`   - ${img}`));
        } else {
          console.log('\n❌ No images found in output!');
          console.log('Full job data:', JSON.stringify(jobData, null, 2));
        }

        return;
      }

      attempts++;
      if (attempts % 5 === 0) {
        process.stdout.write('.');
      }
    }

    console.log('\n❌ Job did not complete within timeout');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data?.node_errors) {
      console.error('Node errors:', JSON.stringify(error.response.data.node_errors, null, 2));
    }
  }
}

testWorkflow().catch(console.error);