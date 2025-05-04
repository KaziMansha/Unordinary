import React, { useState } from 'react';
import { Button, Text, Card, Loader, Container, Title, Stack, Group } from '@mantine/core';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

interface Suggestion {
  date: string;
  hobby: string;
  description: string;
}

const HobbySuggestion: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('Not signed in');
      
      const token = await user.getIdToken();
      const response = await axios.post<{ suggestions: Suggestion[] }>(
        'http://localhost:5000/api/generate-hobby',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuggestions(response.data.suggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (suggestion: Suggestion) => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('Not signed in');
      
      const token = await user.getIdToken();
      const [year, month, day] = suggestion.date.split('-').map(Number);

      await axios.post(
        'http://localhost:5000/api/events',
        {
          day,
          month: month - 1, // Convert to 0-based month
          year,
          title: suggestion.hobby,
          time: '18:00',
          description: suggestion.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove added suggestion
      setSuggestions(prev => prev.filter(s => s.date !== suggestion.date));
    } catch (err) {
      console.error(err);
      setError('Failed to add event');
    }
  };

  return (
    <Container size="sm" mt="xl">
      <Title order={3} mb="md">Hobby Suggestions</Title>
      <Card shadow="sm" p="lg" withBorder>
        <Button 
          fullWidth 
          onClick={generateSuggestions} 
          disabled={loading}
          mb="md"
        >
          {loading ? <Loader size="sm" /> : 'Get Personalized Suggestions'}
        </Button>

        {error && <Text color="red" mb="md">{error}</Text>}

        <Stack spacing="md">
          {suggestions.map((suggestion, index) => (
            <Card key={index} p="md" withBorder>
              <Group position="apart" mb="xs">
                <Text weight={600}>{suggestion.hobby}</Text>
                <Text size="sm" color="dimmed">{suggestion.date}</Text>
              </Group>
              <Text size="sm" mb="md">{suggestion.description}</Text>
              <Button
                fullWidth
                variant="light"
                onClick={() => addToCalendar(suggestion)}
              >
                Add to Calendar
              </Button>
            </Card>
          ))}
        </Stack>

        {suggestions.length === 0 && !loading && (
          <Text color="dimmed" align="center" mt="md">
            No suggestions generated yet
          </Text>
        )}
      </Card>
    </Container>
  );
};

export default HobbySuggestion;