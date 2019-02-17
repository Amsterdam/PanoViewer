
export function logout() {
  // Clear cache and ACCESS_TOKEN from sessionStorage
  sessionStorage.clear();
  location.reload();
}

