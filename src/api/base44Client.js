/**
 * base44Client stub — replaces @base44/sdk for local development.
 *
 * The real implementation will route these calls to the backend API.
 * For now every method returns a sensible no-op so the app compiles
 * and renders without throwing on import.
 *
 * Surface area matched to what the codebase actually calls:
 *   base44.entities.<EntityName>.list / filter / create / update / delete / bulkCreate
 *   base44.auth.me / logout / redirectToLogin / isAuthenticated / updateMe
 *   base44.appLogs.logUserInApp
 */

const noop = () => Promise.resolve(null);
const noopList = () => Promise.resolve([]);

// Proxy returns the same CRUD stub for any entity name.
const entityHandler = {
  get(_, _entityName) {
    return {
      list:       noopList,
      filter:     noopList,
      create:     noop,
      update:     noop,
      delete:     noop,
      bulkCreate: noopList,
    };
  },
};

export const base44 = {
  entities: new Proxy({}, entityHandler),

  auth: {
    me:              () => Promise.resolve(null),
    logout:          noop,
    redirectToLogin: noop,
    isAuthenticated: () => Promise.resolve(false),
    updateMe:        noop,
  },

  appLogs: {
    logUserInApp: noop,
  },
};
