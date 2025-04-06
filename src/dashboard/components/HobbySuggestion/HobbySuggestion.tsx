import React, { useState } from 'react';
import { Button, Text, Card, Loader, Container, Title } from '@mantine/core';
import axios from 'axios';

const HobbySuggestion: React.FC = () => {
  const [hobbySuggestion, setHobbySuggestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Hardcoded dummy hobby data
  const hobbies = [
    {
      hobby: "drawing",
      skillLevel: "intermediate",
      goal: "have fun",
    },
    {
      hobby: "hiking",
      skillLevel: "beginner",
      goal: "build endurance",
    },
  ];

  const generateHobby = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/generate-hobby', {
        hobbies, // 👈 send wrapped in "hobbies" array
      });
      setHobbySuggestion(response.data.suggestion);
    } catch (error) {
      console.error('Error fetching hobby suggestion:', error);
      setHobbySuggestion('Failed to generate a suggestion. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" mt="xl">
      <Title order={2} align="center">Hobby Suggestion</Title>
      <Card shadow="sm" p="lg" mt="md" withBorder>
        <Button fullWidth onClick={generateHobby} disabled={loading}>
          {loading ? <Loader size="sm" /> : 'Generate a hobby suggestion'}
        </Button>
        {hobbySuggestion && (
          <Text align="center" mt="md" weight={500}>
            {hobbySuggestion}
          </Text>
        )}
      </Card>
    </Container>
  );
};

export default HobbySuggestion;
