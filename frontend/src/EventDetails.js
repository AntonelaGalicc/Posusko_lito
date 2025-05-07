import React from 'react';
import { useParams } from 'react-router-dom';

const EventDetails = ({ events }) => {
  const { id } = useParams(); // Dohvaćanje ID-a iz URL-a
  const event = events.find((e) => e.id === parseInt(id)); // Pronađi događaj prema ID-u

  if (!event) {
    return <div>Događaj nije pronađen</div>;
  }

  return (
    <div className="event-details">
      <h1>{event.title}</h1>
      <img src={event.image} alt={event.title} className="event-image" />
      <div className="event-description">
        {event.description.map((desc, index) => (
          <p key={index}>{desc}</p>
        ))}
      </div>
    </div>
  );
};

export default EventDetails;
