function mockRequest(path) {
  return {
    headers: {},
    pathname: path,
    method: 'GET',
    jsgi: { version: [0,3] },
    env: {}
  };
}

exports.mockRequest = mockRequest;