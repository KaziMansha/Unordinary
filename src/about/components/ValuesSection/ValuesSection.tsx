import React from 'react';
import ValueCard from '../ValueCard/ValueCard';
import './ValuesSection.css';

const values = [
  {
    title: 'Innovate',
    description: 'We love fresh ideas and are always improving. Unordinary uses cutting-edge AI to inspire your creativity.',
    image: 'https://images.pexels.com/photos/20943579/pexels-photo-20943579.jpeg?cs=srgb&dl=pexels-jakubzerdzicki-20943579.jpg&fm=jpg'
  },
  {
    title: 'Adventure',
    description: 'Life is an adventure! We help you discover new experiences, from nature hikes to creative workshops.',
    image: 'https://images.pexels.com/photos/24604766/pexels-photo-24604766.jpeg?cs=srgb&dl=pexels-willianjusten-24604766.jpg&fm=jpg'
  },
  {
    title: 'Balance',
    description: 'We believe in well-being. Find a healthy balance between work and play with our mindful activity suggestions.',
    image: 'https://images.pexels.com/photos/2529375/pexels-photo-2529375.jpeg?cs=srgb&dl=pexels-lucaspezeta-2529375.jpg&fm=jpg'
  },
  {
    title: 'Community',
    description: 'Together is better. We encourage connecting with others and sharing experiences to build a vibrant community.',
    image: 'https://images.pexels.com/photos/7148445/pexels-photo-7148445.jpeg?cs=srgb&dl=pexels-kindelmedia-7148445.jpg&fm=jpg'
  }
];

const ValuesSection: React.FC = () => {
  return (
    <section className="values-section">
      <h2 className="values-title">Our Values</h2>
      <div className="values-grid">
        {values.map((value) => (
          <ValueCard
            key={value.title}
            imageSrc={value.image}
            title={value.title}
            description={value.description}
          />
        ))}
      </div>
    </section>
  );
};

export default ValuesSection;
