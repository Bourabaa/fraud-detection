const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();

const { logPrediction, logResponseTime, logError } = require('./metrics');

const app = express();
const PORT = process.env.PORT || 5000; // Use AWS's PORT variable

app.use(cors({
    origin: '*',  // Allow all origins (API Gateway will forward requests)
    credentials: true
}));
app.use(express.json());

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const sagemakerRuntime = new AWS.SageMakerRuntime();

app.post('/api/predict', async (req, res) => {
  const startTime = Date.now();
  try {
    const { endpointName, features } = req.body;

    if (!endpointName) {
      await logError('Missing endpoint name', 'Unknown');
      return res.status(400).json({ error: 'Endpoint name is required' });
    }

    if (!features || features.length !== 30) {
      await logError('Invalid features length', endpointName);
      return res.status(400).json({ error: 'Need exactly 30 features' });
    }

    // Log input for debugging
    console.log('Endpoint:', endpointName);
    console.log('Features received:', features);
    console.log('Features length:', features.length);
    console.log('First 5 features:', features.slice(0, 5));
    console.log('Last 5 features:', features.slice(-5));

    // Try different formats - some models expect different structures
    // Format 1: Nested array (current)
    const bodyFormat1 = JSON.stringify([features]);
    // Format 2: Flat array
    const bodyFormat2 = JSON.stringify(features);
    // Format 3: CSV-like string
    const bodyFormat3 = features.join(',');

    const params = {
      EndpointName: endpointName,
      Body: bodyFormat1, // Start with nested array format
      ContentType: 'application/json',
      Accept: 'application/json'
    };

    // Log request body
    console.log('Request body to SageMaker (nested array):', bodyFormat1);
    console.log('Request body (flat array):', bodyFormat2);
    console.log('Request body (CSV):', bodyFormat3);

    const result = await sagemakerRuntime.invokeEndpoint(params).promise();
    
    // Log raw response
    const rawResponse = result.Body.toString();
    console.log('Raw response from SageMaker:', rawResponse);
    
    const parsedResponse = JSON.parse(rawResponse);
    console.log('Parsed response:', parsedResponse);
    
    const prediction = Array.isArray(parsedResponse) ? parsedResponse[0] : parsedResponse;
    console.log('Final prediction value:', prediction);
    console.log('Prediction type:', typeof prediction);

    // Extract prediction and confidence
    let predictionClass = 0;
    let confidence = 0.5;

    if (typeof prediction === 'object') {
      predictionClass = prediction.predictions ? prediction.predictions[0] : 0;
      if (Array.isArray(prediction.probabilities)) {
        confidence = Math.max(...prediction.probabilities);
      }
    } else {
      predictionClass = prediction > 0.5 ? 1 : 0;
      confidence = Math.abs(prediction);
    }

    // Log metrics to CloudWatch
    const responseTime = Date.now() - startTime;
    await logPrediction(predictionClass, confidence, endpointName);
    await logResponseTime(responseTime, endpointName, true);

    res.json({ success: true, prediction: predictionClass, confidence: confidence });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Error:', error);
    await logError(error.message, req.body?.endpointName || 'Unknown');
    await logResponseTime(responseTime, req.body?.endpointName || 'Unknown', false);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});