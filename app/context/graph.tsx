// main app logic

import isEqual from "lodash/isEqual";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  graphReducer,
  Graph,
  Chat,
  Document,
  Action,
  SET_STATE,
  UUID,
} from "../reducers/graphReducer";
import { fetchComponents, topologicalSort } from "../utils/helpers";

import { ProjectContext } from "./project";

export interface GraphState {
  state: Graph;
  dispatch: React.Dispatch<Action>;
  dependencyOrder: (Chat | Document)[][];
}

const GraphContext = createContext<GraphState | null>(null);

const initialState: Graph = {};

export const GraphProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(graphReducer, initialState);
  const { project } = useContext(ProjectContext);
  const [depsMap, setDepsMap] = useState({});
  const prevDepsMapRef = useRef(depsMap);

  // synch components with project
  useEffect(() => {
    if (project) {
      fetchComponents(project).then((components) => {
        dispatch({ type: SET_STATE, payload: components });
      });
    }
  }, [project]);

  // update the dependency map when the actual dependencies change
  useEffect(() => {
    const newDepsMap = Object.entries(state).reduce(
      (map: Record<UUID, UUID[]>, [id, node]) => {
        map[id] = node.dependencies;
        return map;
      },
      {},
    );
    if (!isEqual(newDepsMap, prevDepsMapRef.current)) {
      setDepsMap(newDepsMap);
    }
    // set the current map to the ref for comparison in the next render cycle
    prevDepsMapRef.current = newDepsMap;
  }, [state]);

  // TODO - missing dependency

  // this stuff is wrong, we build chatbot based on dependency order, so if i change system message text it wont apply the changes
  // this memo works for the order, but the actual contents of the components should be synch with state
  const dependencyOrder = useMemo(() => {
    return topologicalSort(state);
  }, [state]);
  // was depending on despsMap before, but this doesnt update when small changes are made

  return (
    <GraphContext.Provider
      value={{
        state,
        dispatch,
        dependencyOrder,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraph must be used within a GraphProvider");
  }
  return context;
};
