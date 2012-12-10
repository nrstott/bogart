function mockRequest(path) {
  return {
    headers: {},
    pathInfo: path,
    method: 'GET',
    jsgi: { version: [0,3] },
    env: {}
  };
}

function rootRequest() {
  return mockRequest('/');
}

exports.mockRequest = mockRequest;