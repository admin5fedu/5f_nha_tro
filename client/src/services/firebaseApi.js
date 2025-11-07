// Firebase Realtime Database API Wrapper
// This wrapper provides axios-like interface for Firebase operations
import { database } from './firebase';
import { 
  ref, 
  get, 
  set, 
  push, 
  remove, 
  update,
  query, 
  orderByChild, 
  equalTo,
  limitToFirst,
  limitToLast,
  startAt,
  endAt
} from 'firebase/database';

// Helper: Convert Firebase object to array
const objectToArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  
  return Object.entries(obj).map(([key, value]) => {
    // If value already has an id, use it. Otherwise use the key
    if (typeof value === 'object' && value !== null) {
      return { firebase_key: key, ...value };
    }
    return value;
  });
};

// Helper: Find object by id in Firebase structure
const findById = (data, id) => {
  if (!data) return null;
  
  // If data is object, search through values
  if (typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (value && (value.id === id || key === `${getCollectionPrefix(key)}_${id}`)) {
        return { firebase_key: key, ...value };
      }
    }
  }
  
  return null;
};

// Helper: Get collection prefix (e.g., "user" -> "user", "branch" -> "branch")
const getCollectionPrefix = (collection) => {
  return collection.replace(/s$/, ''); // Remove trailing 's' if exists
};

// Helper: Generate Firebase key from id
const getFirebaseKey = (collection, id) => {
  const prefix = getCollectionPrefix(collection);
  return `${prefix}_${id}`;
};

// Helper: Parse path to extract collection and id
const parsePath = (path) => {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  const parts = cleanPath.split('/');
  
  return {
    collection: parts[0],
    id: parts[1],
    subPath: parts.slice(2).join('/')
  };
};

// Helper: Apply filters to data
const applyFilters = (data, filters = {}) => {
  if (!filters || Object.keys(filters).length === 0) return data;
  
  let filtered = Array.isArray(data) ? [...data] : objectToArray(data);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filtered = filtered.filter(item => {
        if (typeof item[key] === 'string' && typeof value === 'string') {
          return item[key].toLowerCase().includes(value.toLowerCase());
        }
        return item[key] === value;
      });
    }
  });
  
  return filtered;
};

const firebaseApi = {
  /**
   * GET request - Fetch data from Firebase
   * @param {string} path - API path (e.g., '/users', '/users/1', '/users?role=admin')
   */
  async get(path) {
    try {
      // Parse URL and query params
      const [pathname, queryString] = path.split('?');
      const { collection, id, subPath } = parsePath(pathname);
      
      // Parse query params
      const params = new URLSearchParams(queryString);
      const filters = {};
      params.forEach((value, key) => {
        filters[key] = value;
      });
      
      // Build Firebase path
      let firebasePath = collection;
      
      if (id) {
        // Specific item by ID
        const dbRef = ref(database, collection);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
          throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
        }
        
        const data = snapshot.val();
        const item = findById(data, parseInt(id));
        
        if (!item) {
          throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
        }
        
        // Handle sub-resources (e.g., /users/1/tasks)
        if (subPath) {
          const subRef = ref(database, subPath);
          const subSnapshot = await get(subRef);
          
          if (subSnapshot.exists()) {
            const subData = objectToArray(subSnapshot.val());
            // Filter by parent ID
            const filtered = subData.filter(subItem => subItem[`${collection.slice(0, -1)}_id`] === parseInt(id));
            return { data: filtered };
          }
          return { data: [] };
        }
        
        return { data: item };
      } else {
        // List all items in collection
        const dbRef = ref(database, firebasePath);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
          return { data: [] };
        }
        
        let data = objectToArray(snapshot.val());
        
        // Apply filters
        data = applyFilters(data, filters);
        
        return { data };
      }
    } catch (error) {
      console.error('Firebase GET error:', error);
      throw error;
    }
  },

  /**
   * POST request - Create new data in Firebase
   * @param {string} path - API path (e.g., '/users')
   * @param {object} payload - Data to create
   */
  async post(path, payload) {
    try {
      const { collection } = parsePath(path);
      const dbRef = ref(database, collection);
      
      // Get current max ID to generate new ID
      const snapshot = await get(dbRef);
      let maxId = 0;
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = objectToArray(data);
        maxId = Math.max(...items.map(item => item.id || 0), 0);
      }
      
      const newId = maxId + 1;
      const newData = {
        id: newId,
        ...payload,
        created_at: payload.created_at || new Date().toISOString()
      };
      
      // Generate Firebase key
      const firebaseKey = getFirebaseKey(collection, newId);
      const newRef = ref(database, `${collection}/${firebaseKey}`);
      
      await set(newRef, newData);
      
      return { data: newData };
    } catch (error) {
      console.error('Firebase POST error:', error);
      throw error;
    }
  },

  /**
   * PUT request - Update existing data in Firebase
   * @param {string} path - API path (e.g., '/users/1')
   * @param {object} payload - Data to update
   */
  async put(path, payload) {
    try {
      const { collection, id } = parsePath(path);
      
      if (!id) {
        throw { response: { status: 400, data: { error: 'ID không hợp lệ' } } };
      }
      
      // Find the item first
      const dbRef = ref(database, collection);
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      const data = snapshot.val();
      const item = findById(data, parseInt(id));
      
      if (!item) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      // Update the item
      const firebaseKey = item.firebase_key;
      const updateRef = ref(database, `${collection}/${firebaseKey}`);
      
      const updatedData = {
        ...item,
        ...payload,
        id: parseInt(id), // Preserve ID
        updated_at: new Date().toISOString()
      };
      
      // Remove firebase_key from data before saving
      delete updatedData.firebase_key;
      
      await set(updateRef, updatedData);
      
      return { data: { message: 'Cập nhật thành công', ...updatedData } };
    } catch (error) {
      console.error('Firebase PUT error:', error);
      throw error;
    }
  },

  /**
   * PATCH request - Partially update data in Firebase
   * @param {string} path - API path (e.g., '/users/1')
   * @param {object} payload - Data to update
   */
  async patch(path, payload) {
    return this.put(path, payload);
  },

  /**
   * DELETE request - Remove data from Firebase
   * @param {string} path - API path (e.g., '/users/1')
   */
  async delete(path) {
    try {
      const { collection, id } = parsePath(path);
      
      if (!id) {
        throw { response: { status: 400, data: { error: 'ID không hợp lệ' } } };
      }
      
      // Find the item first
      const dbRef = ref(database, collection);
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      const data = snapshot.val();
      const item = findById(data, parseInt(id));
      
      if (!item) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      // Delete the item
      const firebaseKey = item.firebase_key;
      const deleteRef = ref(database, `${collection}/${firebaseKey}`);
      
      await remove(deleteRef);
      
      return { data: { message: 'Xóa thành công' } };
    } catch (error) {
      console.error('Firebase DELETE error:', error);
      throw error;
    }
  },

  // Utility methods
  defaults: {
    headers: {
      common: {}
    }
  }
};

export default firebaseApi;

