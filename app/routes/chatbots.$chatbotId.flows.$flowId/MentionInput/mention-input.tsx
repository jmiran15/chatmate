import { useState } from "react";
import { Mention, MentionsInput } from "react-mentions";
import classNames from "./styles.module.css";

interface MentionInputProps {
  name: string;
  defaultValue: string;
  onChange: (value: string) => void;
  suggestions: Array<{ id: string; display: string }>;
}

export function MentionInput({
  name,
  defaultValue,
  onChange,
  suggestions,
}: MentionInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [mentions, setMentions] = useState<any[]>([]);

  console.log("suggestions: ", suggestions);

  const handleChange = (
    event: any,
    newValue: string,
    newPlainTextValue: string,
    mentions: any[],
  ) => {
    setValue(newValue);
    onChange(newValue);
    setMentions(mentions);
    // TODO: lets save the mentions to the database so we don't have to parse them manually
    console.log("mentions and plain text value: ", mentions, newPlainTextValue);
  };

  return (
    <div className="relative">
      <MentionsInput
        value={value}
        onChange={handleChange}
        className="mentions"
        classNames={classNames}
        placeholder="Enter the text you would like to send the user. You can use form submission values using '@', for example 'Hey @name, thanks for submitting!'"
        a11ySuggestionsListLabel="Suggested form fields"
      >
        <Mention
          trigger="@"
          data={suggestions}
          className={classNames.mentions__mention}
        />
      </MentionsInput>
      <input type="hidden" name={`${name}-text`} value={value} />
      <input
        type="hidden"
        name={`${name}-mentions`}
        value={JSON.stringify(mentions)}
      />
    </div>
  );
}
