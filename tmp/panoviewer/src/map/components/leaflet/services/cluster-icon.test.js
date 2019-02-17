import createClusterIcon from './cluster-icon';

describe('createClusterIcon', () => {
  it('should render', () => {
    expect(createClusterIcon({
      getChildCount: jest.fn().mockReturnValue(10)
    })).toMatchSnapshot();
  });
});
