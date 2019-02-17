import get from 'lodash.get';
import isUndefined from 'lodash.isundefined';
import queryString from 'querystring';
import PARAMETERS from '../parameters';

/**
 * ParamsRegistry manages the relations between url parameters, reducers and routes.
 * Since we want to reuse url parameter keys over difference routes and reducers, we can build these
 * by adding routes to each key, that holds only one reducer.
 * Why only one per route per param?
 * Otherwise a dependency will exist between reducers. Example: if we have a url param called "view"
 * that is used in reducers A and B. If in the same route reducer A sets the value of "view",
 * reducer B also updates, as it is in sync with the url param.
 */

let instance;

class ParamsRegistry {
  /**
   * Order alphabetically, but always show the view parameter first
   * @param query
   * @returns {{}}
   */
  static orderQuery(query) {
    return Object.entries(query).sort().sort(([key1], [key2]) =>
      (key1 === PARAMETERS.VIEW ? -1 : key2 === PARAMETERS.VIEW ? 1 : 0)
    ).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value
    }), {});
  }

  static getDefaultReducerSettings(reducerKey, stateKey, overrideOptions = {}) {
    const reducerSettingsKeys = {
      encode: 'encode',
      decode: 'decode',
      selector: 'selector',
      defaultValue: 'defaultValue'
    };
    const { encode, decode, selector, defaultValue } = reducerSettingsKeys;
    const allowedKeys = [encode, decode, defaultValue, selector];

    Object.keys(overrideOptions).forEach((value) => {
      if (!allowedKeys.includes(value)) {
        throw new Error(`Key given to reducer settings is not allowed: "${value}"`);
      }
    });

    return {
      selector: (state) => get(state, `[${reducerKey}]${stateKey}`),
      decode: (val) => {
        if (val === 'true' || val === 'false') {
          return val === 'true';
        } else if (!isNaN(val)) {
          return parseFloat(val);
        }
        return val;
      },
      encode: (val) => {
        if (typeof val === 'boolean' || typeof val === 'number') {
          return String(val);
        }
        return val;
      },
      reducerKey,
      stateKey,
      ...overrideOptions
    };
  }

  static destroy() {
    instance = null;
  }

  /**
   *
   * @param routerNamespace
   * @returns {ParamsRegistry}
   *
   * @example
   * const paramsRegistery = new ParamsRegistry('ROUTE_NAMESPACE')
   * paramsRegistery.addParameter('view', (routes) => {
   *     routes
   *     .add('ROUTE_NAMESPACE/search', {
   *         stateKey: 'view',
   *         reducerKey: 'searchReducer'
   *     })
   *     .add('ROUTE_NAMESPACE/about', {
   *         stateKey: 'view',
   *         reducerKey: 'userReducer'
   *     })
   * }).addParameter('anotherParam', ...
   */
  constructor(routerNamespace = 'ROUTER') {
    this.queryParamResult = {};
    this.addParameter = this.addParameter.bind(this);
    this.getStateFromQueries = this.getStateFromQueries.bind(this);
    this.bindRouteToReducerSettings = this.bindRouteToReducerSettings.bind(this);

    this.historyObject = null;

    this.settings = {
      routerNamespace
    };

    if (instance) {
      return instance;
    }

    instance = this;
    return instance;
  }

  addParameter(param, callback) {
    if (this.result[param]) {
      throw new Error(`Parameter is already registered: ${param}`);
    }
    const routeApi = {
      add: (routes, reducerKey, stateKey, reducerObject, addHistory = true) => {
        [...Array.isArray(routes) ? [...routes] : [routes]].forEach((route) => {
          if (!reducerKey || (typeof stateKey === 'undefined')) {
            throw new Error(`Param "${param}" with route "${route}" must contain a reducerKey and stateKey`);
          }
          this.bindRouteToReducerSettings(
            param, route, reducerKey, stateKey, reducerObject, addHistory
          );
        });
        return routeApi;
      }
    };

    callback(routeApi);

    return this;
  }

  isRouterType(action) {
    return (action.type && action.type.startsWith(this.settings.routerNamespace));
  }

  /**
   *
   * @param param
   * @param route
   * @param reducerKey
   * @param stateKey
   * @param reducerObject
   * @param addHistory
   */
  bindRouteToReducerSettings(param, route, reducerKey, stateKey, reducerObject, addHistory) {
    let paramRouteReducerSettings = get(this.result, `[${param}].routes`, {});
    if (paramRouteReducerSettings[route]) {
      throw new Error(`Route is already registered for parameter "${param}" with route "${route}"`);
    }

    paramRouteReducerSettings = {
      ...paramRouteReducerSettings,
      [route]: {
        ...ParamsRegistry.getDefaultReducerSettings(reducerKey, stateKey, reducerObject),
        addHistory
      }
    };

    this.result = {
      [param]: {
        ...this.result[param],
        routes: paramRouteReducerSettings
      }
    };
  }

  queryShouldChangeHistory(newQuery, route) {
    const search = location.search && location.search.substr(1);
    const currentQuery = search ? queryString.decode(search) : {};
    const diffA = Object.entries(newQuery).reduce((acc, [key, value]) => ([
      ...acc,
      ...(currentQuery[key] !== value) ? [key] : []
    ]), []);

    const diffB = Object.entries(currentQuery).reduce((acc, [key, value]) => ([
      ...acc,
      ...(newQuery[key] !== value) ? [key] : []
    ]), []);
    return [...new Set([...diffA, ...diffB])]
      .map((parameter) => this.getReduxObject(parameter, route).addHistory)
      .includes(true);
  }

  setQueriesFromState(currentLocationType, state, nextAction) {
    if (this.isRouterType(nextAction)) {
      return undefined;
    }
    const query = Object.entries(this.result).reduce((acc, [parameter, paramObject]) => {
      const reducerObject = get(paramObject, `[routes][${currentLocationType}]`, null);
      if (reducerObject) {
        const encodedValue = reducerObject.encode(reducerObject.selector(state));
        let newQuery = {};

        // we need to use JSON.stringify here to also check if arrays and objects are equal
        if (parameter === 'legenda') {
          // console.log(reducerObject.decode(encodedValue), reducerObject.defaultValue)
        }
        const isDefaultValue = !!(
          reducerObject && (
            JSON.stringify(reducerObject.decode(encodedValue)) ===
            JSON.stringify(reducerObject.defaultValue)
          )
        );
        if (
          encodedValue &&
          !isDefaultValue
        ) {
          newQuery = { [parameter]: encodedValue };
        }
        return {
          ...acc,
          ...newQuery
        };
      }

      return acc;
    }, {});
    const orderedQuery = ParamsRegistry.orderQuery(query);
    const searchQuery = queryString.stringify(orderedQuery);
    const currentPath = window.location.pathname;

    // the history should be changed only when the url string is changed
    // this check prevents recording history changes on every action.
    const recordHistory = searchQuery !== window.location.search.substring(1);
    if (recordHistory && this.history) {
      if (this.queryShouldChangeHistory(orderedQuery, currentLocationType, state)) {
        this.history.push(`${currentPath}?${searchQuery}`);
      } else {
        this.history.replace(`${currentPath}?${searchQuery}`);
      }
    }

    return searchQuery;
  }

  /**
   * Used by reducers to retrieve the state from action.meta.query.
   * @param reducerKey
   * @param action
   * @returns {*}
   */
  getStateFromQueries(reducerKey, action) {
    return (this.isRouterType(action) ?
      Object.entries(this.result).reduce((acc, [parameter, object]) => {
        const reducerObject = get(object, `routes[${action.type}]`);

        if (reducerObject && reducerObject.reducerKey === reducerKey) {
          const urlParam = get(action, `meta.query[${parameter}]`);
          const decodedValue = reducerObject.decode(urlParam);
          return {
            ...acc,
            [reducerObject.stateKey]: isUndefined(urlParam) ?
              reducerObject.defaultValue :
              decodedValue
          };
        }
        const reducerObj = Object
          .values(object.routes)
          .find((obj) => obj.reducerKey === reducerKey);
        return {
          ...acc,
          ...reducerObj ? { [reducerObj.stateKey]: reducerObj.defaultValue } : {}
        };
      }, {}) : {});
  }

  getReduxObject(parameter, route) {
    return get(this.result, `${parameter}.routes[${route}]`, {});
  }

  removeParamsWithDefaultValue(parameters, route) {
    return Object.entries(parameters).reduce((acc, [parameter, value]) => {
      const reducerObject = this.getReduxObject(parameter, route);
      const shouldAddQuery = (value && ((value !== reducerObject.defaultValue && value !== '') || (Array.isArray(value) && value.length !== 0)));
      return {
        ...acc,
        ...(shouldAddQuery) ? { [parameter]: value } : {}
      };
    }, {});
  }

  /**
   * If we need to go to a route and also set a new URL param, this method can be used to retrieve
   * the values for that specific route
   * @param parameters
   * @param route
   * @param encode Tell if we should encode the parameters values
   * @returns {*}
   */
  getParametersForRoute(parameters, route, encode = true) {
    return Object.entries(parameters).reduce((acc, [parameter, value]) => {
      const reducerObject = this.getReduxObject(parameter, route);
      const encodeFn = reducerObject.encode;
      const valueToSet = (encode && encodeFn) ? encodeFn(value) : value;
      return encodeFn ? {
        ...acc,
        [parameter]: valueToSet
      } : acc;
    }, {});
  }

  set history(history) {
    this.historyObject = history;
  }

  get history() {
    return this.historyObject;
  }

  set result(result) {
    this.queryParamResult = {
      ...this.queryParamResult,
      ...result
    };
  }

  get result() {
    return this.queryParamResult;
  }
}

export default ParamsRegistry;
