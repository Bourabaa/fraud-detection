/**
 * Minimal Lambda Function - Test version
 */

exports.handler = async (event) => {
  console.log('Handler called');
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Lambda is working!',
      event: event
    })
  };
};

