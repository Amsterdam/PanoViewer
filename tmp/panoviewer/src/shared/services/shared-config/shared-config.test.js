import SHARED_CONFIG from './shared-config';
import { getEnvironment } from '../../environment';

jest.mock('../../environment');

describe('The sharedConfig service', () => {
  it('gives you the configuration based on global environment', () => {
    getEnvironment.mockImplementation(() => ('PRODUCTION'));
    expect(SHARED_CONFIG).toMatchSnapshot();

    getEnvironment.mockImplementation(() => ('PRE_PRODUCTION'));
    expect(SHARED_CONFIG).toMatchSnapshot();

    getEnvironment.mockImplementation(() => ('ACCEPTATION'));
    expect(SHARED_CONFIG).toMatchSnapshot();

    getEnvironment.mockImplementation(() => ('DEVELOPMENT'));
    expect(SHARED_CONFIG).toMatchSnapshot();
  });
});
