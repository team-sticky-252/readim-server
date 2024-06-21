export const HttpStatus = {
  OK: {
    statusCode: 200,
    message: "OK",
  },
  INVALID_REQUEST: {
    statusCode: 400,
    message: "The bad request",
  },
  BAD_URL: {
    statusCode: 400,
    message: "Invalid URL",
  },
  PARSE_ERROR: {
    statusCode: 512,
    message: "Failed To Parse The Article",
  },
  INTERNAR_SERVER_ERROR: {
    statusCode: 500,
    message: "Internal Server Error",
  },
};

export class HttpError extends Error {
  constructor({ statusCode, message }) {
    super(message);
    this.statusCode = statusCode;
  }

  getError() {
    return {
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
