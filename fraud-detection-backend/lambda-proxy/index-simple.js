/**
 * Simple Lambda Function to proxy API requests
 * Minimal version for debugging
 */

const BACKEND_BASE_URL = 'http://frauddetection-env.eba-43pmkezt.us-east-1.elasticbeanstalk.com';
const http = require('http');
const urlModule = require('url');

exports.handler = async (event) => {
  console.log('Handler called');
  console.log('Event:', JSON.stringify(event));
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '3600'
  };

  try {
    // Get HTTP method
    let httpMethod = 'GET';
    if (event.requestContext && event.requestContext.http) {
      httpMethod = event.requestContext.http.method || 'GET';
    } else if (event.httpMethod) {
      httpMethod = event.httpMethod;
    }

    // Get path
    let path = '/api/predict';
    if (event.rawPath) {
      path = event.rawPath;
    } else if (event.path) {
      path = event.path;
    }

    console.log('Method:', httpMethod);
    console.log('Path:', path);

    // Handle OPTIONS (CORS preflight)
    if (httpMethod === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({ message: 'OK' })
      };
    }

    // Build target URL
    const targetUrl = BACKEND_BASE_URL + path;
    console.log('Target URL:', targetUrl);

    // Get request body
    const requestBody = event.body || null;
    console.log('Request body exists:', !!requestBody);

    // Parse URL
    const parsedUrl = urlModule.parse(targetUrl);
    console.log('Parsed URL:', parsedUrl.hostname, parsedUrl.port, parsedUrl.path);

    // Make HTTP request
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      console.log('Making request with options:', JSON.stringify(options));

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('Response received, status:', res.statusCode);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', (err) => {
        console.error('Request error:', err);
        reject(err);
      });

      if (requestBody) {
        req.write(requestBody);
      }

      req.end();
    });

    console.log('Response status:', response.status);
    console.log('Response body length:', response.body.length);

    // Parse response
    let responseBody;
    try {
      responseBody = JSON.parse(response.body);
    } catch (e) {
      responseBody = response.body;
    }

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('Error in handler:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message
      })
    };
  }
};

