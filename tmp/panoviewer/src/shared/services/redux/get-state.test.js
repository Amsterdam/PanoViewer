import getState from './get-state';

describe('The getState service', () => {
  it('getState should return the state', () => {
    const state = { testValue: 1 };
    window.reduxStore = {
      getState: jest.fn(() => state)
    };
    expect(getState()).toEqual(state);
  });
});
