import { v4 as uuidv4 } from "uuid";

import { wouldCreateCycle, getDependencies } from "../utils/helpers";
// import omit from "lodash/omit";

export type UUID = ReturnType<typeof uuidv4>;

export type Graph = Record<UUID, Chat | Document>;

export const CREATE_NODE = "CREATE_NODE";
export const DELETE_NODE = "DELETE_NODE";
export const EDIT_NODE = "EDIT_NODE";
export const SET_STATE = "SET_STATE";
export const CHAT_TYPE = "CHAT";
export const DOCUMENT_TYPE = "DOCUMENT";

export interface Node {
  id: UUID;
  type: typeof CHAT_TYPE | typeof DOCUMENT_TYPE;
  name: string;
  dependencies: UUID[];
  project: UUID;
}

export interface Chat extends Node {
  model: string;
  temperature: number;
  max_tokens: number;
  system_message: string;
  user_message: string;
  chat_history: UUID;
}

export interface Document extends Node {
  number_documents: number;
  similarity_threshold: number;
  search_query: string;
}

export interface CreateAction {
  type: typeof CREATE_NODE;
  payload: Chat | Document;
}

export interface DeleteAction {
  type: typeof DELETE_NODE;
  payload: UUID;
}

export interface EditAction {
  type: typeof EDIT_NODE;
  payload: Pick<Chat | Document, "id"> & Partial<Chat | Document>;
}

export interface SetStateAction {
  type: typeof SET_STATE;
  payload: Graph;
}

export type Action = CreateAction | DeleteAction | EditAction | SetStateAction;

export function graphReducer(state: Graph, action: Action): Graph {
  switch (action.type) {
    case CREATE_NODE: {
      return {
        ...state,
        [action.payload.id as UUID]: {
          ...action.payload,
        } as Chat | Document,
      } as Graph;
    }
    case DELETE_NODE: {
      const updatedGraph = { ...state };
      const deletedId = action.payload as UUID;

      // delete the node itself
      delete updatedGraph[deletedId];

      // Look for dependencies
      for (const nodeId in updatedGraph) {
        const node: Chat | Document = updatedGraph[nodeId] as Chat | Document;
        // Remove deletedId from dependencies list
        node.dependencies = node.dependencies.filter((id) => id !== deletedId);
      }

      return updatedGraph as Graph;
    }
    case EDIT_NODE: {
      return {
        ...state,
        [action.payload.id as UUID]: {
          ...state[action.payload.id as UUID], // prev state
          ...action.payload, // new state
          dependencies: getDependencies(
            action.payload as Document | Chat,
          ).filter(
            (dependency) =>
              !wouldCreateCycle(
                state,
                state[action.payload.id as UUID],
                dependency,
              ),
          ),
        },
      };
    }
    case SET_STATE: {
      return action.payload as Graph;
    }
    default:
      return state;
  }
}
