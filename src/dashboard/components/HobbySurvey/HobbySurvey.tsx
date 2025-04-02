// /src/components/HobbySurvey.tsx
import React, { useState } from "react";
import {
  TextInput,
  Select,
  Button,
  Container,
  Title,
  Box,
  Group,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface Hobby {
  hobby: string;
  skillLevel: string;
  goal: string;
}

const HobbySurvey: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      hobbies: [{ hobby: "", skillLevel: "", goal: "" }],
    },
    // Validate each hobby object in the array
    validate: {
      hobbies: {
        hobby: (value: string) => (value.trim() ? null : "Hobby is required"),
        skillLevel: (value: string) => (value ? null : "Skill level is required"),
        goal: (value: string) => (value ? null : "Goal is required"),
      },
    },
  });

  const handleSubmit = async (values: { hobbies: Hobby[] }) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      try {
        // Send each hobby individually
        await Promise.all(
          values.hobbies.map(async (hobby) => {
            const response = await fetch("http://localhost:5000/api/hobbies", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                hobby_name: hobby.hobby,
                skill_level: hobby.skillLevel,
                goal: hobby.goal,
              }),
            });
            const data = await response.json();
            console.log("Hobby upserted:", data);
            return data;
          })
        );
        setSubmitted(true);
        navigate("/dashboard");
      } catch (error) {
        console.error("Error creating hobbies:", error);
      }
    }
  };

  return (
    <Container size="sm" p="lg">
      <Title order={2} mb="md" align="center">
        Hobby Survey
      </Title>
      {!submitted ? (
        <Box
          component="form"
          onSubmit={form.onSubmit(handleSubmit)}
          p="md"
          sx={{ background: "#f8f9fa", borderRadius: "8px" }}
        >
          {form.values.hobbies.map((_, index) => (
            <Box
              key={index}
              mb="md"
              p="md"
              sx={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "#fff",
              }}
            >
              <Group position="apart">
                <Title order={4}>Hobby {index + 1}</Title>
                {form.values.hobbies.length > 1 && (
                  <ActionIcon
                    color="red"
                    onClick={() => form.removeListItem("hobbies", index)}
                  >
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
            <Button
              variant="light"
              leftIcon={<IconPlus size={16} />}
              onClick={() =>
                form.insertListItem("hobbies", {
                  hobby: "",
                  skillLevel: "",
                  goal: "",
                })
              }
            >
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

export default HobbySurvey;
