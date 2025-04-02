import { useState } from "react";
import { TextInput, Select, Button, Container, Title, Box, Group, ActionIcon } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus, IconMinus } from "@tabler/icons-react";

interface Hobby {
  id: number;
  hobby: string;
  skillLevel: string;
  goal: string;
}

const SurveyForm: React.FC = () => {
  const [hobbies, setHobbies] = useState<Hobby[]>([
    { id: 1, hobby: "", skillLevel: "", goal: "" }
  ]);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      hobbies: hobbies,
    },
    validate: {
      hobbies: {
        hobby: (value: string) => (value.trim() ? null : "Hobby is required"),
        skillLevel: (value: string) => (value ? null : "Skill level is required"),
        goal: (value: string) => (value ? null : "Goal is required"),
      }
    },
  });

  const handleSubmit = (values: { hobbies: Hobby[] }) => {
    console.log("Survey Data:", values.hobbies);
    setSubmitted(true);
  };

  const addHobby = () => {
    setHobbies([...hobbies, { id: Date.now(), hobby: "", skillLevel: "", goal: "" }]);
  };

  const removeHobby = (id: number) => {
    setHobbies(hobbies.filter((hobby) => hobby.id !== id));
  };

  return (
    <Container size="sm" p="lg">
      <Title order={2} mb="md" align="center">
        Hobby Survey
      </Title>

      {!submitted ? (
        <Box component="form" onSubmit={form.onSubmit(handleSubmit)} p="md" sx={{ background: "#f8f9fa", borderRadius: "8px" }}>
          {hobbies.map((hobby, index) => (
            <Box key={hobby.id} mb="md" p="md" sx={{ border: "1px solid #ddd", borderRadius: "8px", background: "#fff" }}>
              <Group position="apart">
                <Title order={4}>Hobby {index + 1}</Title>
                {hobbies.length > 1 && (
                  <ActionIcon color="red" onClick={() => removeHobby(hobby.id)}>
                    <IconMinus size={20} />
                  </ActionIcon>
                )}
              </Group>

              <TextInput
                label="What is a hobby you wish to focus on?"
                placeholder="Enter hobby"
                {...form.getInputProps(`hobbies.${index}.hobby`)}
                required
              />

              <Select
                label="What is your current skill level?"
                placeholder="Select skill level"
                data={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "pro", label: "Pro" },
                ]}
                {...form.getInputProps(`hobbies.${index}.skillLevel`)}
                required
                mt="md"
              />

              <Select
                label="What is your goal with this hobby?"
                placeholder="Select goal"
                data={[
                  { value: "improve", label: "To improve in skill level" },
                  { value: "practice", label: "To simply practice" },
                  { value: "fun", label: "To have fun" },
                ]}
                {...form.getInputProps(`hobbies.${index}.goal`)}
                required
                mt="md"
              />
            </Box>
          ))}

          <Group position="center" mt="md">
            <Button variant="light" leftIcon={<IconPlus size={16} />} onClick={addHobby}>
              Add Hobby
            </Button>
          </Group>

          <Button type="submit" fullWidth mt="lg" color="blue">
            Submit Survey
          </Button>
        </Box>
      ) : (
        <Title order={3} color="green" align="center">
          Thank you for your response!
        </Title>
      )}
    </Container>
  );
};

export default SurveyForm;