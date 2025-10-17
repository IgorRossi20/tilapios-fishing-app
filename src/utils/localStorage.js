export const saveToLocalStorage = (key, value) => {
  // online-only mode: no-op, do not persist anything locally
};

export const getFromLocalStorage = (key, defaultValue) => {
  // online-only mode: always return provided default value, no reads from storage
  return defaultValue;
};