import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import "./style.css";

const App = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    fetch(`${apiUrl}/get_events`)
      .then((response) => response.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Greška pri dohvaćanju događaja:", error);
        setError("Došlo je do greške pri dohvaćanju događaja.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Učitavanje događaja...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events events={events} />} />
          <Route path="/event/:id" element={<EventDetails events={events} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

const Navbar = () => (
  <nav className="navbar">
    <div className="nav-links">
      <Link to="/">Općenito</Link>
      <Link to="/events">Nadolazeći događaji</Link>
      <Link to="/login">Prijava</Link>
      <Link to="/register">Registracija</Link>
    </div>
  </nav>
);

const Home = () => (
  <div className="home">
    <h1>Posuško lito</h1>
    <p>
      Posuško lito je manifestacija koja svake godine privuče tisuće posjetitelja
      u Posušje, koje broji oko 20.000 stanovnika. Ove godine, manifestacija je
      bila bogata kulturnim i sportskim događanjima, uključujući malonogometne
      turnire, taekwondo natjecanje, biciklistički đir, te Posušku desetku, 
      polumaraton. Poseban naglasak stavljen je na očuvanje tradicije kroz folklor, 
      ikavicu i gastro festival. Organizatori su zadovoljni velikim brojem 
      posjetitelja, koji su u protekla tri i pol mjeseca pratili gotovo 60 događaja, 
      a dolazak turista iz Hercegovine, Hrvatske i inozemstva bio je veći nego ikad. 
      Posuško lito nastavlja rasti i privlačiti sve više posjetitelja zbog bogatog 
      programa i snažne organizacije.
    </p>
  </div>
);

const Events = ({ events }) => (
  <div className="events">
    <h2>Nadolazeći događaji</h2>
    <div className="event-grid">
      {events.map((event, index) => (
        <Link to={`/event/${event.id}`} key={index} className="event-card">
          <img src={event.image} alt={event.title} />
          <h3>{event.title}</h3>
        </Link>
      ))}
    </div>
  </div>
);

const EventDetails = ({ events }) => {
  const { id } = useParams();
  const event = events.find((e) => String(e.id) === id);

  if (!event) return <div>Događaj nije pronađen</div>;

  return (
    <div className="event-details">
      <h2>{event.title}</h2>
      <img src={event.image} alt={event.title} />
      <div className="event-description">
        {Array.isArray(event.description)
          ? event.description.map((desc, index) => <p key={index}>{desc}</p>)
          : <p>{event.description}</p>}
      </div>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const handleSubmit = (event) => {
    event.preventDefault();
    // Add login logic here (e.g., Firebase, local storage, etc.)
    navigate("/"); // Redirect to home after login
  };

  return (
    <div className="form-container">
      <h2>Prijava</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Lozinka" required />
        <button type="submit">Prijavi se</button>
      </form>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const handleSubmit = (event) => {
    event.preventDefault();
    // Add registration logic here
    navigate("/login"); // Redirect to login page after registration
  };

  return (
    <div className="form-container">
      <h2>Registracija</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Ime" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Lozinka" required />
        <button type="submit">Registriraj se</button>
      </form>
    </div>
  );
};

const Footer = () => (
  <footer className="footer">
    <p>&copy; {new Date().getFullYear()} Posuško lito</p>
  </footer>
);

const NotFound = () => (
  <div>
    <h2>Stranica nije pronađena!</h2>
    <Link to="/">Povratak na početnu</Link>
  </div>
);

export default App;
