import { latLngBounds } from 'leaflet';
import { boundsToString, getBounds, isBoundsAPoint, isValidBounds } from './bounds';

jest.mock('leaflet');

describe('bounds service', () => {
  latLngBounds.mockImplementation(() => ({
    latLngBoundsMock: true
  }));
  describe('isValidBounds', () => {
    it('should return true when bounds is valid', () => {
      expect(isValidBounds({ isValid: jest.fn().mockReturnValue(true) })).toBe(true);
    });

    it('should return false when isValid is not set or returns false', () => {
      expect(isValidBounds({ isValid: jest.fn().mockReturnValue(false) })).toBe(false);
      expect(isValidBounds({})).toBe(false);
    });
  });

  describe('getBounds', () => {
    it('should return a shape', () => {
      const bounds = {
        isValid: jest.fn().mockReturnValue(true)
      };
      expect(getBounds({
        getBounds: jest.fn().mockReturnValue(bounds)
      })).toBe(bounds);
    });

    it('should return a point', () => {
      const bounds = {
        isValid: jest.fn().mockReturnValue(true)
      };
      expect(getBounds({
        getLatLng: jest.fn().mockReturnValue(bounds)
      })).toEqual({
        latLngBoundsMock: true
      });
    });

    it('should return an empty object', () => {
      expect(getBounds({})).toEqual({});
    });
  });

  describe('isBoundsAPoint', () => {
    it('should return true if getSouthWest() is equal to getNorthEast()', () => {
      expect(isBoundsAPoint({
        getNorthEast: jest.fn().mockReturnValue({
          equals: jest.fn().mockReturnValue(true)
        }),
        getSouthWest: jest.fn()
      })).toEqual(true);
    });
  });

  describe('boundsToString', () => {
    it('should return the bounds in a string', () => {
      expect(boundsToString({
        toBBoxString: jest.fn().mockReturnValue('12345')
      })).toEqual('12345');

      expect(boundsToString(12345)).toEqual('12345');
    });
  });
});
