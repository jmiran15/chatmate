import { MentionComponent } from "@syncfusion/ej2-react-dropdowns";
import {
  HtmlEditor,
  Image,
  Inject,
  Link,
  QuickToolbar,
  RichTextEditorComponent,
  Toolbar,
} from "@syncfusion/ej2-react-richtexteditor";
import { Input } from "@mantine/core";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { UUID } from "~/reducers/graphReducer";

interface Mention {
  name: string;
  id: UUID;
}

export default function MentionsEditor({
  object,
  value,
  label,
  data,
}: {
  object: React.MutableRefObject<any>;
  value: string;
  label: string;
  data: Mention[];
}) {
  let id = uuidv4();

  const fieldsData: { [key: string]: string } = {
    text: "name",
    value: "id",
  };

  let itemTemplate = function (data: any) {
    return <p id={data.id}>{data.name}</p>;
  };

  function displayTemplate(data: any): JSX.Element {
    return <span id={`${data.id}$${data.name}`}>{data.name}</span>;
  }

  function actionBegineHandler(args: any): void {
    if (args.requestType === "EnterAction") {
      args.cancel = true;
    }
  }

  return (
    <div className="control-pane">
      <Input.Label>{label}</Input.Label>
      <div className="control-section" id={`rte${id}`}>
        <div className="rte-control-section">
          <RichTextEditorComponent
            id={`mention_integration${id}`}
            ref={object}
            placeholder="Type @ to use output from other components"
            actionBegin={actionBegineHandler}
            value={value}
          >
            <Inject
              services={[HtmlEditor, Toolbar, Image, Link, QuickToolbar]}
            />
          </RichTextEditorComponent>
        </div>
      </div>
      <MentionComponent
        id={`mentionEditor${id}`}
        target={`#mention_integration${id}_rte-edit-view`}
        suggestionCount={8}
        showMentionChar={false}
        allowSpaces={true}
        dataSource={data.map((mention) => ({
          id: mention.id,
          name: mention.name,
        }))}
        fields={fieldsData}
        popupWidth="250px"
        popupHeight="200px"
        itemTemplate={itemTemplate}
        displayTemplate={displayTemplate}
      ></MentionComponent>
    </div>
  );
}
