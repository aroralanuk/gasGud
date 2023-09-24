import {
  Card,
  Image,
  TextInput,
  Text,
  Badge,
  Button,
  Group,
  Slider,
  Container,
  Divider,
} from "@mantine/core";

function WidgetCard() {
  return (
    <Container size="xs">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section component="a" inheritPadding pt={10}>
          <TextInput
            size="md"
            radius="md"
            label="Pay"
            description="Enter collateral amount"
            placeholder="0.0 ETH"
          />
          <Divider my="xs" label="Leverage" labelPosition="left" />
          <Slider
            defaultValue={1}
            color="violet"
            min={1}
            max={100}
            label={(value) => value.toFixed(1)}
            step={0.5}
            styles={{ markLabel: { display: "none" } }}
            labelAlwaysOn
          />
          <TextInput
            size="md"
            radius="md"
            label="Long"
            description="Enter long amount"
            placeholder="0.0 GAS"
          />
        </Card.Section>

        <Text size="sm" c="dimmed">
          Entry price: 182 Wei
        </Text>
        <Text size="sm" c="dimmed">
          Liquidation price: 232 Wei
        </Text>

        <Button color="violet" fullWidth mt="md" radius="md">
          Go long
        </Button>
      </Card>
    </Container>
  );
}

export default WidgetCard;
