/**
 * CloudWatch Metrics Module
 * Logs fraud detection metrics to AWS CloudWatch
 */

const AWS = require('aws-sdk');

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const NAMESPACE = 'FraudDetection/API';

/**
 * Log a prediction metric to CloudWatch
 */
async function logPrediction(prediction, confidence, endpointName) {
  try {
    const isFraud = prediction === 1;
    
    const params = {
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'PredictionCount',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'PredictionType',
              Value: isFraud ? 'Fraud' : 'Legitimate'
            },
            {
              Name: 'Endpoint',
              Value: endpointName
            }
          ]
        },
        {
          MetricName: 'ConfidenceScore',
          Value: confidence * 100,
          Unit: 'Percent',
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'PredictionType',
              Value: isFraud ? 'Fraud' : 'Legitimate'
            },
            {
              Name: 'Endpoint',
              Value: endpointName
            }
          ]
        }
      ]
    };

    await cloudwatch.putMetricData(params).promise();
    console.log(`✅ Metrics logged: ${isFraud ? 'Fraud' : 'Legitimate'} (confidence: ${(confidence * 100).toFixed(2)}%)`);
  } catch (error) {
    console.error('❌ Error logging metrics to CloudWatch:', error.message);
    // Don't throw - metrics logging shouldn't break the API
  }
}

/**
 * Log API response time
 */
async function logResponseTime(responseTimeMs, endpointName, success) {
  try {
    const params = {
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'ResponseTime',
          Value: responseTimeMs,
          Unit: 'Milliseconds',
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'Status',
              Value: success ? 'Success' : 'Error'
            },
            {
              Name: 'Endpoint',
              Value: endpointName
            }
          ]
        }
      ]
    };

    await cloudwatch.putMetricData(params).promise();
    console.log(`✅ Response time logged: ${responseTimeMs}ms`);
  } catch (error) {
    console.error('❌ Error logging response time:', error.message);
  }
}

/**
 * Log API errors
 */
async function logError(errorMessage, endpointName) {
  try {
    const params = {
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'ErrorCount',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'ErrorType',
              Value: errorMessage.substring(0, 50) // First 50 chars
            },
            {
              Name: 'Endpoint',
              Value: endpointName || 'Unknown'
            }
          ]
        }
      ]
    };

    await cloudwatch.putMetricData(params).promise();
    console.log(`✅ Error logged to CloudWatch`);
  } catch (error) {
    console.error('❌ Error logging error metric:', error.message);
  }
}

module.exports = {
  logPrediction,
  logResponseTime,
  logError
};
