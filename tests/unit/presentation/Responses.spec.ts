import { describe, it, expect } from 'vitest';
import { ok, created, noContent, badRequest, notFound, internalError } from '../../../src/presentation/Responses';

describe('Responses', () => {
  describe('ok', () => {
    it('should return 200 with body and optional headers', () => {
      const body = { foo: 'bar' };
      const headers = { 'X-Test': 'yes' };
      expect(ok(body, headers)).toEqual({ statusCode: 200, body, headers });
      expect(ok(body)).toEqual({ statusCode: 200, body });
    });
  });

  describe('created', () => {
    it('should return 201 with body and optional headers', () => {
      const body = { id: 1 };
      const headers = { Location: '/resource/1' };
      expect(created(body, headers)).toEqual({ statusCode: 201, body, headers });
      expect(created(body)).toEqual({ statusCode: 201, body });
    });
  });

  describe('noContent', () => {
    it('should return 204 with optional headers and no body', () => {
      const headers = { 'X-Empty': 'true' };
      expect(noContent(headers)).toEqual({ statusCode: 204, headers });
      expect(noContent()).toEqual({ statusCode: 204 });
    });
  });

  describe('badRequest', () => {
    it('should return 400 with body', () => {
      const body = { message: 'Bad input' };
      expect(badRequest(body)).toEqual({ statusCode: 400, body });
    });
    it('should use default type for body', () => {
      expect(badRequest({ message: 'fail' })).toEqual({ statusCode: 400, body: { message: 'fail' } });
    });
  });

  describe('notFound', () => {
    it('should return 404 with body', () => {
      const body = { message: 'Not found' };
      expect(notFound(body)).toEqual({ statusCode: 404, body });
    });
    it('should use default type for body', () => {
      expect(notFound({ message: 'nope' })).toEqual({ statusCode: 404, body: { message: 'nope' } });
    });
  });

  describe('internalError', () => {
    it('should return 500 with body', () => {
      const body = { message: 'Server error' };
      expect(internalError(body)).toEqual({ statusCode: 500, body });
    });
    it('should use default type for body', () => {
      expect(internalError({ message: 'fail' })).toEqual({ statusCode: 500, body: { message: 'fail' } });
    });
  });
});
