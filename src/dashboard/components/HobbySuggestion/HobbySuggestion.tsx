import React, { useState } from 'react';
import { Button, Text, Card, Loader, Container, Title } from '@mantine/core';
import axios from 'axios';
import { auth } from '../../../firebase-config'; // Adjust the path if needed

const HobbySuggestion: React.FC = () => {
  const [hobbySuggestion, setHobbySuggestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const scheduleHobbies = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setHobbySuggestion('No user signed in.');
        return;
      }
      const idToken = await user.getIdToken();

      const response = await axios.post(
        'http://localhost:5000/api/auto-schedule-hobbies',
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 201) {
        setHobbySuggestion('🎉 Successfully scheduled 3 hobby events!');
      } else {
        setHobbySuggestion('Something went wrong. Try again.');
      }
    } catch (error) {
      console.error('Error scheduling hobbies:', error);
      setHobbySuggestion('Failed to schedule hobbies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" mt="xl">
      <Title order={2} align="center" mb="lg">
        Hobby Activity Scheduler
      </Title>

      <Card shadow="sm" p="lg" mt="md" withBorder>
        <Button
          fullWidth
          onClick={scheduleHobbies}
          disabled={loading}
          variant="gradient"
          gradient={{ from: 'teal', to: 'blue', deg: 60 }}
        >
          {loading ? <Loader size="sm" color="white" /> : 'Generate & Schedule Hobby Activities'}
        </Button>

        {hobbySuggestion && (
          <Text align="center" mt="md" weight={500} color="green">
            {hobbySuggestion}
          </Text>
        )}
      </Card>
    </Container>
  );
};

export default HobbySuggestion;
