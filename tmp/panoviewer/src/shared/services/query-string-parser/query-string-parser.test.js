import queryStringParser, { encodeQueryParams } from './query-string-parser';

describe('The query string parser service', () => {
  it('handles undefined input', () => {
    expect(
      queryStringParser(undefined)
    ).toEqual(null);
  });

  it('handles empty string input', () => {
    expect(
      queryStringParser('')
    ).toEqual(null);
  });

  it('turns a query string into an object', () => {
    expect(
      queryStringParser('?a=b&one=1&bool=false')
    ).toEqual({
      a: 'b',
      one: '1',
      bool: 'false'
    });
  });

  it('ignores the first character', () => {
    expect(
      queryStringParser('/a=b&one=1&bool=false')
    ).toEqual({
      a: 'b',
      one: '1',
      bool: 'false'
    });
  });

  it('checks if it needs to ignore the first character', () => {
    expect(
      queryStringParser('a=b')
    ).toEqual({
      a: 'b'
    });
  });

  it('decodes keys and values', () => {
    expect(
      queryStringParser('?a=b%20c&one%2Ftwo=12')
    ).toEqual({
      a: 'b c',
      'one/two': '12'
    });
  });

  it('can handle equal-signs in a value', () => {
    expect(
      queryStringParser('?a=b=c&one=12==&two=&three==&four===44')
    ).toEqual({
      a: 'b=c',
      one: '12==',
      two: '',
      three: '=',
      four: '==44'
    });
  });
});

describe('encodeQueryParams', () => {
  it('should generate the query string', () => {
    const result = 'query=params&space=has%20space';
    const params = {
      query: 'params',
      space: 'has space'
    };
    expect(encodeQueryParams(params)).toEqual(result);
  });
});
