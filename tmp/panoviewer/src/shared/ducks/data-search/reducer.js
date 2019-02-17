import {
  FETCH_GEO_SEARCH_RESULTS_FAILURE,
  FETCH_GEO_SEARCH_RESULTS_REQUEST,
  FETCH_GEO_SEARCH_RESULTS_SUCCESS_LIST,
  FETCH_GEO_SEARCH_RESULTS_SUCCESS_PANEL,
  FETCH_QUERY_SEARCH_MORE_RESULTS_SUCCESS,
  FETCH_QUERY_SEARCH_RESULTS_FAILURE,
  FETCH_QUERY_SEARCH_RESULTS_REQUEST,
  FETCH_QUERY_SEARCH_RESULTS_SUCCESS,
  initialState,
  REDUCER_KEY,
  SET_QUERY_CATEGORY
} from './constants';
import { routing } from '../../../app/routes';
import { FETCH_DATA_SELECTION_REQUEST } from '../data-selection/constants';
import paramsRegistry from '../../../store/params-registry';

export { REDUCER_KEY as DATA_SEARCH_REDUCER };

export default function reducer(state = initialState, action) {
  const enrichedState = {
    ...state,
    ...paramsRegistry.getStateFromQueries(REDUCER_KEY, action)
  };

  switch (action.type) {
    case routing.dataSearchCategory.type:
      return {
        ...enrichedState,
        category: action.payload.category
      };

    case FETCH_QUERY_SEARCH_RESULTS_REQUEST:
      return {
        ...enrichedState,
        isLoading: true,
        resultsQuery: [],
        numberOfResults: 0,
        query: action.payload
      };

    case FETCH_QUERY_SEARCH_RESULTS_SUCCESS: {
      const { results, numberOfResults } = action.payload;
      return {
        ...enrichedState,
        isLoading: false,
        numberOfResults,
        resultsQuery: results
      };
    }

    case FETCH_QUERY_SEARCH_MORE_RESULTS_SUCCESS: {
      return {
        ...enrichedState,
        isLoading: false,
        numberOfResults: 999,
        resultsQuery: [{
          ...state.resultsQuery[0],
          ...action.payload[0]
        }]
      };
    }

    case FETCH_GEO_SEARCH_RESULTS_REQUEST:
      return {
        ...enrichedState,
        isLoading: true,
        geoSearch: action.payload
      };

    case FETCH_GEO_SEARCH_RESULTS_SUCCESS_PANEL: {
      const { results, numberOfResults } = action.payload;
      return {
        ...enrichedState,
        isLoading: false,
        numberOfResults,
        resultsMapPanel: results
      };
    }

    case FETCH_GEO_SEARCH_RESULTS_SUCCESS_LIST: {
      const { results, numberOfResults } = action.payload;
      return {
        ...enrichedState,
        isLoading: false,
        numberOfResults,
        resultsMap: results
      };
    }

    case FETCH_QUERY_SEARCH_RESULTS_FAILURE:
    case FETCH_GEO_SEARCH_RESULTS_FAILURE:
      return {
        ...enrichedState,
        isLoading: false,
        error: action.payload
      };

    case SET_QUERY_CATEGORY:
      return {
        ...enrichedState,
        category: action.payload
      };

    case FETCH_DATA_SELECTION_REQUEST:
      return {
        ...enrichedState
      };

    default:
      return enrichedState;
  }
}
