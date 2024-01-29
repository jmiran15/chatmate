import {
  Button,
  Group,
  NativeSelect,
  NumberInput,
  Stack,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useParams, useNavigate } from "@remix-run/react";
import { useEffect, useState, useRef, useMemo } from "react";

import { useGraph } from "~/context/graph";
import {
  CHAT_TYPE,
  Chat as ChatInterface,
  DELETE_NODE,
  DOCUMENT_TYPE,
  EDIT_NODE,
  UUID,
} from "~/reducers/graphReducer";
import {
  USER_INPUT_UUID,
  getAvailableDependencies,
  htmlToPlaceholder,
  placeholderToHtml,
} from "~/utils/helpers";
import MentionsEditor from "./MentionsEditor";

export default function Chat({ component }: { component: ChatInterface }) {
  const navigate = useNavigate();
  const { state, dispatch } = useGraph();
  // SHOULD PASS THIS IN MAIN PAGE, SINCE USED BY MOST COMPONENTS
  let availableVariables = [
    {
      name: "User input",
      id: USER_INPUT_UUID,
    },
    ...getAvailableDependencies(state, component.id).map((id) => {
      return {
        name: state[id].name,
        id,
      };
    }),
  ];
  const { componentId, projectId } = useParams();
  const [name, setName] = useState<string>(component.name);
  const [model, setModel] = useState<string>(component.model);
  const [temperature, setTemperature] = useState<number>(component.temperature);
  const [maxTokens, setMaxTokens] = useState<number>(component.max_tokens);
  let systemMessage = useMemo(() => {
    return placeholderToHtml(component.system_message, {
      ...state,
      [USER_INPUT_UUID]: {
        name: "User input",
        id: USER_INPUT_UUID,
        number_documents: 0,
        similarity_threshold: 0,
        search_query: "",
        dependencies: [],
        project: USER_INPUT_UUID,
        type: DOCUMENT_TYPE,
      },
    });
  }, [component.system_message, state]);
  let userMessage = useMemo(() => {
    return placeholderToHtml(component.user_message, {
      ...state,
      [USER_INPUT_UUID]: {
        name: "User input",
        id: USER_INPUT_UUID,
        number_documents: 0,
        similarity_threshold: 0,
        search_query: "",
        dependencies: [],
        project: USER_INPUT_UUID,
        type: DOCUMENT_TYPE,
      },
    });
  }, [component.user_message, state]);
  let system = useRef<{ getHtml: () => string } | null>(null);
  let user = useRef<{ getHtml: () => string } | null>(null);

  // when we save, we convert the text with mentions back to our format

  useEffect(() => {
    if (componentId !== component.id) {
      throw new Error("component id mismatch");
    }
  }, [componentId, component.id]);

  console.log({
    component_render: component,
  });

  function handleSave() {
    // let component = {
    //   name,
    //   model,
    //   temperature,
    //   max_tokens: maxTokens,
    //   system_message: htmlToPlaceholder(system.current!.getHtml()),
    //   user_message: htmlToPlaceholder(user.current!.getHtml()),
    // };
    // supabaseClient
    //   .from("chat_components")
    //   .update(component)
    //   .eq("id", componentId)
    //   .select()
    //   .then(({ data, error }) => {
    //     if (error) {
    //       console.log(error);
    //       return;
    //     } else {
    //       console.log({ data });
    //     }
    //   });
    // dispatch({
    //   type: EDIT_NODE,
    //   payload: {
    //     id: componentId as UUID,
    //     type: CHAT_TYPE,
    //     ...component,
    //   },
    // });
    return null;
  }

  function handleDelete() {
    // supabaseClient
    //   .from("chat_components")
    //   .delete()
    //   .eq("id", componentId)
    //   .then(({ error }) => {
    //     if (error) {
    //       console.log(error);
    //       return;
    //     }
    //   });
    // dispatch({
    //   type: DELETE_NODE,
    //   payload: componentId as UUID,
    // });
    // navigate(`/projects/${projectId}/components`);
    return null;
  }

  return (
    <Stack w="100%">
      <TextInput
        label="Component name"
        placeholder="New chat component"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <NativeSelect
        data={["gpt-4", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]}
        value={model}
        onChange={(e) => setModel(e.target.value)}
        label="Select the model you would like to use in this chain"
      />
      <NumberInput
        label="Temperature"
        defaultValue={0.7}
        precision={1}
        min={0}
        step={0.1}
        max={2}
        value={temperature}
        onChange={setTemperature as (value: number | "") => void}
      />
      <NumberInput
        label="Max output tokens"
        defaultValue={256}
        precision={0}
        min={1}
        step={1}
        max={2048}
        value={maxTokens}
        onChange={setMaxTokens as (value: number | "") => void}
      />
      <MentionsEditor
        object={system}
        value={systemMessage}
        label={"System message"}
        data={availableVariables}
      />
      <MentionsEditor
        object={user}
        value={userMessage}
        label={"User message"}
        data={availableVariables}
      />

      <Group w="100%" position="apart">
        <Tooltip label="Delete this chain">
          <Button variant="light" color="red" onClick={handleDelete}>
            Delete
          </Button>
        </Tooltip>
        <Tooltip label="Save this chain">
          <Button onClick={handleSave}>Save</Button>
        </Tooltip>
      </Group>
    </Stack>
  );
}
