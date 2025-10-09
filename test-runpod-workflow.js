#!/usr/bin/env node

/**
 * Test script for RunPod serverless ComfyUI integration
 * Verifies that the RunPod endpoint is working correctly
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;
const RUNPOD_API_URL = process.env.RUNPOD_API_URL || `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`;

if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
  console.error('❌ Error: RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID must be set in .env');
  process.exit(1);
}

console.log('🧪 RunPod Workflow Test');
console.log('========================\n');
console.log(`Endpoint: ${RUNPOD_API_URL}`);
console.log(`Endpoint ID: ${RUNPOD_ENDPOINT_ID}\n`);

// Create axios client
const client = axios.create({
  baseURL: RUNPOD_API_URL,
  headers: {
    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

/**
 * Build a minimal test workflow (64x64 for quick testing)
 */
function buildTestWorkflow() {
  return {
    "3": {
      "inputs": {
        "seed": 42,
        "steps": 20,  // Fewer steps for faster testing
        "cfg": 2.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "dDBattlemapsSDXL10_v10.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": 512,  // Small size for quick test
        "height": 512,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": "2d DnD battlemap of simple stone room, top-down view, overhead perspective, aerial",
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": "grid, low angle, isometric, oblique, horizon, text, watermark, logo, caption, people, creatures, monsters, blurry, artifacts",
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "test_battlemap",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

/**
 * Submit test job to RunPod
 */
async function submitJob() {
  console.log('📤 Submitting test job...');
  
  const workflow = buildTestWorkflow();
  
  try {
    const response = await client.post('/run', {
      input: { workflow }
    });
    
    const jobId = response.data.id;
    console.log(`✅ Job submitted successfully`);
    console.log(`   Job ID: ${jobId}\n`);
    
    return jobId;
  } catch (error) {
    console.error(`❌ Failed to submit job: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Poll for job completion
 */
async function waitForCompletion(jobId) {
  console.log('⏳ Waiting for completion...');
  
  const maxWaitTime = 300000; // 5 minutes
  const pollInterval = 3000;   // 3 seconds
  const startTime = Date.now();
  
  let pollCount = 0;
  
  while (Date.now() - startTime < maxWaitTime) {
    pollCount++;
    
    try {
      const response = await client.get(`/status/${jobId}`);
      const data = response.data;
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`   Poll #${pollCount} (${elapsed}s): ${data.status}`);
      
      if (data.status === 'COMPLETED') {
        console.log(`\n✅ Job completed successfully!`);
        console.log(`   Execution time: ${Math.round(data.executionTime / 1000)}s`);
        console.log(`   Total time: ${elapsed}s\n`);
        return data;
      }
      
      if (data.status === 'FAILED' || data.status === 'CANCELLED' || data.status === 'TIMED_OUT') {
        throw new Error(`Job ${data.status}: ${data.error || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.error(`❌ Job not found (may have expired)`);
      }
      throw error;
    }
  }
  
  throw new Error(`Job timed out after ${Math.round(maxWaitTime / 1000)}s`);
}

/**
 * Display results
 */
function displayResults(jobData) {
  console.log('📊 Results:');
  console.log('============\n');
  
  if (jobData.output && jobData.output.images && jobData.output.images.length > 0) {
    const image = jobData.output.images[0];
    console.log(`✅ Image generated successfully`);
    console.log(`   URL: ${image.data}`);
    console.log(`   Filename: ${image.filename}`);
    console.log(`   Type: ${image.type}\n`);
    
    console.log('💡 Tip: This URL will expire after a few days.');
    console.log('   Configure S3 in .env to store images permanently.\n');
  } else {
    console.log(`⚠️  No images in output`);
    console.log(`   Output: ${JSON.stringify(jobData.output, null, 2)}\n`);
  }
}

/**
 * Main test function
 */
async function runTest() {
  try {
    const jobId = await submitJob();
    const result = await waitForCompletion(jobId);
    displayResults(result);
    
    console.log('✅ RunPod integration test PASSED\n');
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ RunPod integration test FAILED`);
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the test
runTest();

