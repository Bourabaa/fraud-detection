/**
 * AWS Lambda Function to proxy API requests to backend
 * Compatible with Lambda Function URLs
 */

// Backend URL - using HTTP since Elastic Beanstalk doesn't have HTTPS configured
const BACKEND_BASE_URL = 'http://frauddetection-env.eba-43pmkezt.us-east-1.elasticbeanstalk.com';

const https = require('https');
const http = require('http');
const urlModule = require('url');

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    console.log('HTTP Method:', httpMethod);
    console.log('Path:', path);

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Build target URL
    let targetUrl = BACKEND_BASE_URL + path;
    console.log('Target URL:', targetUrl);

    // Add query parameters if they exist
    if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
      try {
        const url = new URL(targetUrl);
        Object.keys(event.queryStringParameters).forEach(key => {
          url.searchParams.append(key, event.queryStringParameters[key]);
        });
        targetUrl = url.toString();
        console.log('Target URL with query params:', targetUrl);
      } catch (urlError) {
        console.error('Error building URL with query params:', urlError);
      }
    }

    // Prepare request body
    let requestBody = null;
    let contentLength = 0;
    if (event.body && (httpMethod === 'POST' || httpMethod === 'PUT')) {
      requestBody = event.body;
      // Handle if body is already a string
      if (typeof requestBody === 'object') {
        requestBody = JSON.stringify(requestBody);
      }
      contentLength = Buffer.byteLength(requestBody, 'utf8');
      console.log('Request body:', requestBody);
      console.log('Request body length:', contentLength);
    }

    // Parse URL
    const parsedUrl = urlModule.parse(targetUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    console.log('Making request to:', parsedUrl.hostname, parsedUrl.port, parsedUrl.path);

    // Make HTTP request
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path || '/',
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      // Add Content-Length if we have a body
      if (contentLength > 0) {
        options.headers['Content-Length'] = contentLength;
      }

      console.log('Request options:', JSON.stringify(options, null, 2));

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('Response status:', res.statusCode);
          console.log('Response headers:', JSON.stringify(res.headers, null, 2));
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      });

      req.on('error', (err) => {
        console.error('Request error:', err);
        reject(err);
      });

      // Set timeout
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout after 30 seconds'));
      });

      if (requestBody) {
        req.write(requestBody);
      }

      req.end();
    });

    // Parse response
    let responseBody;
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || 'application/json';

    if (contentType.includes('application/json')) {
      try {
        responseBody = JSON.parse(response.body);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseBody = response.body;
      }
    } else {
      responseBody = response.body;
    }

    console.log('✅ Success - Backend responded with status:', response.status);

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': contentType,
      },
      body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message,
        name: error.name,
      }),
    };
  }
};
