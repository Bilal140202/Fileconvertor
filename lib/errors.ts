export class InvalidPasswordError extends Error {
  name = 'InvalidPasswordError';

  constructor(message = 'Invalid password') {
    super(message);
  }
}

export class UnsupportedArchiveFormatError extends Error {
  name = 'UnsupportedArchiveFormatError';

  constructor(message = 'Unsupported archive format') {
    super(message);
  }
}
