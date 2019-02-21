const createHotspot = (angle, distance) => {
  const element = document.createElement('div');
  element.setAttribute('class', 'c-panoviewer-hotspot');
  const innerDiv = document.createElement('button');
  innerDiv.setAttribute('class', 'c-panoviewer-hotspot__content')
  const rotate = `rotateX(${angle}deg)`;
  const scale = `scale(${10 / distance})`;

  innerDiv.setAttribute('style', `transform: ${rotate} ${scale};`);
  element.appendChild(innerDiv);
  return element;
}

export default createHotspot;
