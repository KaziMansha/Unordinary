import classes from './HobbyCard.module.css';
import { Image, Text, Title } from '@mantine/core';

type HobbyCardProps = {
  image: string;
  hobbyName: string;
  description: string;
};

export function HobbyCard({ image, hobbyName, description }: HobbyCardProps) {
  return (
    <section className={classes.wrapper}>
      <div className={classes.title}>
        <Title order={1}>Hobby of the Week!</Title>
      </div>
      <div className={classes.image}>
        <Image src={image} radius="md" fit="cover" />
      </div>
      <div className={classes.hobbyTitle}>
        <Title order={4}>{hobbyName}</Title>
      </div>
      <div className={classes.hobbyText}>
        <Text>{description}</Text>
      </div>
    </section>
  );
}
