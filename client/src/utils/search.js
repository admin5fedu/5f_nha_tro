export const objectContainsTerm = (source, term, options = {}) => {
  if (!term) return true;

  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return true;

  const { keys, excludeKeys = [] } = options;

  const visited = new Set();

  const shouldIncludeKey = (key) => {
    if (!key) return true;
    if (excludeKeys.includes(key)) return false;
    if (keys && keys.length > 0) {
      return keys.includes(key);
    }
    return true;
  };

  const stack = [source];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === null || current === undefined) {
      continue;
    }

    if (typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean') {
      if (String(current).toLowerCase().includes(normalizedTerm)) {
        return true;
      }
      continue;
    }

    if (current instanceof Date) {
      if (current.toISOString().toLowerCase().includes(normalizedTerm)) {
        return true;
      }
      continue;
    }

    if (typeof current === 'object') {
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (Array.isArray(current)) {
        for (let index = 0; index < current.length; index += 1) {
          stack.push(current[index]);
        }
      } else {
        Object.keys(current).forEach((key) => {
          if (!shouldIncludeKey(key)) return;
          stack.push(current[key]);
        });
      }
    }
  }

  return false;
};

export const filterByTerm = (items = [], term, options = {}) => {
  if (!term) return items;
  return items.filter((item) => objectContainsTerm(item, term, options));
};

