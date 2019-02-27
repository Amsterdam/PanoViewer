import createHotspot from './hotspot';

describe('hotspot', () => {
  it('should create the hotspot', () => {
    const hotspot = createHotspot(90, 50);
    expect(hotspot).toMatchSnapshot();
  });
});
