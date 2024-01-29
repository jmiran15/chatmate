import { Message, Role } from "@prisma/client";

import {
  Graph,
  Chat,
  Document,
  UUID,
  CHAT_TYPE,
  DOCUMENT_TYPE,
} from "../reducers/graphReducer";

import { embed } from "./openai";

export const USER_INPUT_UUID = "3698a514-3128-43aa-80f0-eb72aeb2c387";

export interface AvailableDependency {
  name: string;
  id: UUID;
}

// TODO - add jsdoc
export function wouldCreateCycle(
  nodes: Graph,
  node: Chat | Document,
  newDep: UUID | null,
) {
  const visited: Record<UUID, boolean> = {};
  const visiting: Record<UUID, boolean> = {};

  function dfs(currentNode: Chat | Document) {
    if (visiting[currentNode.id]) {
      return true; // cycle detected
    }
    if (visited[currentNode.id]) {
      return false; // already visited no need to revisit
    }

    visiting[currentNode.id] = true;

    // Checks if current node is the newly added dependency and adds dependency for DFS cycle check
    const nodeDependencies =
      currentNode.id === node.id
        ? [...node.dependencies, newDep]
        : currentNode.dependencies;

    for (const dep of nodeDependencies) {
      if (dep && nodes[dep] && dfs(nodes[dep])) {
        // cycle detected
        return true;
      }
    }

    visited[currentNode.id] = true;
    visiting[currentNode.id] = false;
    return false;
  }

  return dfs(node);
}

// TODO - add js doc
export function extractDependencies(text: string) {
  const dependencies: UUID[] = [];
  const regex = /{{(.*?)}}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, groupMatch] = match;
    dependencies.push(groupMatch);
  }

  return dependencies;
}

// TODO - add js doc
export function topologicalSort(nodes: Graph) {
  const result: (Chat | Document)[][] = [];
  const level: Record<UUID, number> = {};
  let maxLevel = 0;

  for (const node of Object.values(nodes)) {
    if (wouldCreateCycle(nodes, node, null)) {
      throw new Error("Circular dependency detected");
    }
  }

  for (const node of Object.values(nodes)) {
    resolveLevel(node);
  }

  function resolveLevel(node: Chat | Document) {
    if (level[node.id] !== undefined) {
      return level[node.id];
    }

    let nodeLevel = 0;

    for (const dep of node.dependencies) {
      if (dep && nodes[dep]) {
        nodeLevel = Math.max(nodeLevel, resolveLevel(nodes[dep]) + 1);
      }
    }

    level[node.id] = nodeLevel;
    maxLevel = Math.max(maxLevel, nodeLevel);
    if (!result[nodeLevel]) {
      result[nodeLevel] = [node];
    } else if (!result[nodeLevel].some((n) => n.id === node.id)) {
      result[nodeLevel].push(node);
    }
    return level[node.id];
  }

  return result.slice(0, maxLevel + 1);
}

// TODO - add js doc
// SHOULD WE BE EXTRACTING DEPENDENCIES ON FETCH OR STORING IN DB?
export async function fetchComponents(project: UUID) {
  const [{ data: chatComponents }, { data: documentComponents }] =
    await Promise.all([
      supabaseClient.from("chat_components").select("*").eq("project", project),
      supabaseClient
        .from("document_components")
        .select("*")
        .eq("project", project),
    ]);

  let components: Graph = {};
  chatComponents?.forEach((component: Chat) => {
    components[component.id] = {
      ...component,
      dependencies: [
        ...Array.from(
          new Set([
            ...extractDependencies(component.system_message),
            ...extractDependencies(component.user_message),
          ]),
        ),
      ],
      type: CHAT_TYPE,
    };
  });

  documentComponents?.forEach((component: Document) => {
    components[component.id] = {
      ...component,
      dependencies: [
        ...Array.from(
          new Set([...extractDependencies(component.search_query)]),
        ),
      ],
      type: DOCUMENT_TYPE,
    };
  });

  return components;
}

// TODO - add js doc
export function getAvailableDependencies(state: Graph, id: UUID) {
  let availableIds: UUID[] = [];
  const nodeIds = Object.keys(state);

  // Add all node id except the current node's id
  nodeIds.forEach(function (nodeId) {
    if (id !== nodeId && !state[nodeId].dependencies.includes(id)) {
      availableIds.push(nodeId);
    }
  });

  // Remove any nodeIds where the node's dependencies includes the current node's id to prevent circular dependency
  const circularIds = state[id].dependencies;
  availableIds = availableIds.filter(
    (nodeId: UUID) => !circularIds.includes(nodeId),
  );

  return availableIds;
}

// TODO - add js doc
export function getDependencies(payload: Chat | Document) {
  switch (payload.type) {
    case CHAT_TYPE:
      return Array.from(
        new Set([
          ...extractDependencies((payload as Chat).system_message),
          ...extractDependencies((payload as Chat).user_message),
        ]),
      );
    case DOCUMENT_TYPE:
      return Array.from(
        new Set([...extractDependencies((payload as Document).search_query)]),
      );
    default:
      return [];
  }
}

// Regular expression for matching uuids in a string.
export const UUID_REGEX = /(?:\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/;

export function htmlToPlaceholder(html: string): string {
  return html.replace(
    /<span contenteditable="false" class="e-mention-chip"><span id="(.*?)\$[\s\S]*?">(.*?)<\/span><\/span>/g,
    function (match, uuid, name) {
      return `{{${uuid}}}`;
    },
  );
}

export function placeholderToHtml(text: string, state: Graph): string {
  return text.replace(
    /{{(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})}}/g,
    function (match, uuid) {
      return state[uuid]
        ? `<span contenteditable="false" class="e-mention-chip"><span id="${uuid}$${state[uuid].name}">${state[uuid].name}</span></span>`
        : "";
    },
  );
}

export async function fetchContexts(
  query: string,
  component: UUID,
  match_count: number,
  match_threshold: number,
) {
  // const embeddingResponse = await embed(query);

  // let { data } = await supabaseClient.rpc("match_documents", {
  //   component,
  //   embedding: embeddingResponse.data[0].embedding,
  //   match_count,
  //   match_threshold,
  // });

  // return data;
  return null;
}

export function formatContexts(
  data: {
    id: UUID;
    content: string;
    similarity: number;
    metadata: {
      file: string;
    };
  }[],
) {
  return data
    .map((el) => {
      return `${el.content}`;
    })
    .join("\n\n");
}

// probably don't need this, just makes it easier to work with the data
export function transformData(messageArray: Message[]) {
  const userMessages = messageArray.filter(
    (message) => message.role === Role.USER,
  );
  const assistantMessages = messageArray.filter(
    (message) => message.role === Role.ASSISTANT,
  );

  const chains: { [key: string]: Message[] } = {};

  for (const assistantMessage of assistantMessages) {
    const chain = (chains[assistantMessage.component] =
      chains[assistantMessage.component] || []);
    let relatedUserMessages = userMessages.filter(
      (userMessage) => userMessage.reference === assistantMessage.reference,
    );

    for (let userMessage of relatedUserMessages) {
      if (!chain.includes(userMessage)) {
        chain.push(userMessage);
      }
    }
    chain.push(assistantMessage);
  }

  return chains;
}

export function replaceContent(messages: Message[], str: string) {
  let replacedStr = str;
  messages.forEach((el) => {
    const regex = new RegExp(`{{${el.component}}}`, "g");
    replacedStr = replacedStr.replace(regex, el.content);
  });
  return replacedStr;
}
