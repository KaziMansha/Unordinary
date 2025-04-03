import React, { useState } from 'react';
import { Button, Text, Card, Loader, Container, Title } from '@mantine/core';
import axios from 'axios';

const HobbySuggestion: React.FC = () => {
    const [hobbySuggestion, setHobbySuggestion] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Hardcoded values
    const hobbyType = "drawing";
    const skillLevel = "intermediate";
    const goal = "have fun";

    const generateHobby = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/generate-hobby', {
                hobbyType,
                skillLevel,
                goal
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