const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};

export const getByUri = (uri) =>
  fetch(uri)
    .then((response) => handleErrors(response))
    .then((response) => response.json());

