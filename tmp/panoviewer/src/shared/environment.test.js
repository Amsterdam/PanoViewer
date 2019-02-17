import {
  getEnvironment,
  isDevelopment,
  ENVIRONMENTS
} from './environment';

let nodeEnv;

beforeEach(() => {
  nodeEnv = process.env.NODE_ENV;
});

afterEach(() => {
  process.env.NODE_ENV = nodeEnv;
});

describe('The environment service', () => {
  it('is set to production based on NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    expect(getEnvironment('data.amsterdam.nl')).toBe(ENVIRONMENTS.PRODUCTION);
  });

  it('is set to pre production based on hostname', () => {
    process.env.NODE_ENV = 'production';
    expect(getEnvironment('pre.data.amsterdam.nl')).toBe(ENVIRONMENTS.PRE_PRODUCTION);
  });

  it('is set to acceptance based on NODE_ENV', () => {
    process.env.NODE_ENV = 'acceptance';
    expect(getEnvironment('acc.data.amsterdam.nl')).toBe(ENVIRONMENTS.ACCEPTANCE);
  });

  it('is set to development based on NODE_ENV', () => {
    process.env.NODE_ENV = 'development';
    expect(getEnvironment('localhost')).toBe(ENVIRONMENTS.DEVELOPMENT);
  });

  it('defaults to development', () => {
    process.env.NODE_ENV = '';
    expect(getEnvironment()).toBe(ENVIRONMENTS.DEVELOPMENT);
  });

  it('isDevelopment is true for default hostname', () => {
    process.env.NODE_ENV = 'development';
    expect(isDevelopment()).toBe(true);
  });
});
