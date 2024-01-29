import { Anchor, Card, Group } from "@mantine/core";
import { ChatComponent, DocumentComponent } from "@prisma/client";
import { useNavigate } from "react-router-dom";

export default function ComponentCard({
  component,
}: {
  component: ChatComponent | DocumentComponent;
}) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`${component.id}`);
  }

  return (
    <Card withBorder radius="md" padding="md" onClick={handleClick}>
      <Group>
        <Anchor size="xl">{component.name}</Anchor>
      </Group>
    </Card>
  );
}
