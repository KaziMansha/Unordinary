import { Card, Image, Text, Title } from '@mantine/core';
import classes from './HobbyCard.module.css'
import unordinaryLogo from '../../assets/Unordinary_Logo.png'

interface HobbyCardProps {
  image: string;
  hobbyName: string;
  description: string;
}

export function HobbyCard({ image, hobbyName, description }: HobbyCardProps) {
  return (
    <div>
        <section className={classes.wrapper}>
            <div className={classes.title}>
                <Title order={1}>
                    {"Hobby of the Week!"}
                </Title>
            </div>
            <div className={classes.image}>
                <Image src={image} height={200}/>
            </div>
            <div className={classes.hobbyTitle}>
                <Title order={5}>
                    {hobbyName}
                </Title>
            </div>
            <div className={classes.hobbyText}>
                <Text>
                    {description}
                </Text>
            </div>
        </section>
    </div>
  );
}