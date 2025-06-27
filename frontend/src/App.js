import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import "./style.css";

console.log("API URL:", process.env.REACT_APP_API_URL);

const SECRET_TOKEN = "tajni_token_za_prijavljene";

const App = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    const apiUrl =
      process.env.REACT_APP_API_URL || "http://158.179.216.162:5000";
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

  if (loading) return <div>Učitavanje događaja...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Router>
      <div className="app-container">
        <Navbar
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          setUserRole={setUserRole}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/events"
            element={
              <Events
                events={events}
                setEvents={setEvents}
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              />
            }
          />
          <Route path="/event/:id" element={<EventDetails events={events} />} />
          <Route
            path="/login"
            element={
              <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
            }
          />
          <Route path="/register" element={<Register />} />
          {isLoggedIn && (
            <Route
              path="/add-event"
              element={<AddEvent events={events} setEvents={setEvents} />}
            />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

const Navbar = ({ isLoggedIn, setIsLoggedIn, setUserRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Općenito</Link>
        <Link to="/events">Nadolazeći događaji</Link>
        {isLoggedIn && <Link to="/add-event">Dodaj događaj</Link>}
        {!isLoggedIn && <Link to="/login">Prijava</Link>}
        {!isLoggedIn && <Link to="/register">Registracija</Link>}
      </div>
      {isLoggedIn && (
        <button onClick={handleLogout} className="logout-button">
          Odjava
        </button>
      )}
    </nav>
  );
};

const Login = ({ setIsLoggedIn, setUserRole }) => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://158.179.216.162:5000";

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsLoggedIn(true);
        setUserRole(data.role);
        navigate("/events");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Greška pri prijavi");
    }
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
  const apiUrl = process.env.REACT_APP_API_URL || "http://158.179.216.162:5000";

  const handleSubmit = async (event) => {
    event.preventDefault();
    // inputi su: 0 - Ime, 1 - Email, 2 - Lozinka
    const email = event.target[1].value;
    const password = event.target[2].value;

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registracija uspješna");
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Greška pri registraciji");
    }
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

const Events = ({ events, setEvents, isLoggedIn, userRole }) => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://158.179.216.162:5000";

  const handleDelete = async (title) => {
    if (
      !window.confirm(`Jesi li siguran/a da želiš obrisati događaj "${title}"?`)
    )
      return;

    try {
      const response = await fetch(`${apiUrl}/delete_event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SECRET_TOKEN}`,
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setEvents((prev) => prev.filter((e) => e.title !== title));
      alert(data.message);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="events">
      <h2>Nadolazeći događaji</h2>
      <div className="event-grid">
        {events.map((event, index) => (
          <div key={index} className="event-card">
            <Link to={`/event/${event.id}`}>
              <img src={event.image} alt={event.title} />
              <h3>{event.title}</h3>
            </Link>
            {isLoggedIn && userRole === "admin" && (
              <button
                className="delete-button"
                onClick={() => handleDelete(event.title)}
              >
                Obriši
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AddEvent = ({ events, setEvents }) => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://158.179.216.162:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newEvent = { title, image, description };

    try {
      const response = await fetch(`${apiUrl}/send_event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setEvents((prevEvents) => [
        ...prevEvents,
        { id: prevEvents.length + 1, title, image, description },
      ]);
      navigate("/events");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Dodaj novi događaj</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Naslov događaja"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="URL slike"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          required
        />
        <textarea
          placeholder="Opis događaja"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
        />
        <button type="submit">Dodaj događaj</button>
      </form>
    </div>
  );
};

const EventDetails = ({ events }) => {
  const { id } = useParams();
  const event = events.find((e) => String(e.id) === id);

  if (!event) return <div>Događaj nije pronađen</div>;

  return (
    <div className="event-details">
      <h2>{event.title}</h2>
      <img src={event.image} alt={event.title} />
      <div className="event-description">
        {Array.isArray(event.description) ? (
          event.description.map((desc, index) => <p key={index}>{desc}</p>)
        ) : (
          <p>{event.description}</p>
        )}
      </div>
    </div>
  );
};

const Home = () => (
  <div className="home">
    <h1>Posuško lito</h1>
    <p>
      Posuško lito je manifestacija koja svake godine privuče tisuće
      posjetitelja u Posušje, koje broji oko 20.000 stanovnika. Ove godine,
      manifestacija je bila bogata kulturnim i sportskim događanjima,
      uključujući malonogometne turnire, taekwondo natjecanje, biciklistički
      đir, te Posušku desetku, polumaraton. Poseban naglasak stavljen je na
      očuvanje tradicije kroz folklor, ikavicu i gastro festival. Organizatori
      su zadovoljni velikim brojem posjetitelja, koji su u protekla tri i pol
      mjeseca pratili gotovo 60 događaja, a dolazak turista iz Hercegovine,
      Hrvatske i inozemstva bio je veći nego ikad. Posuško lito nastavlja rasti
      i privlačiti sve više posjetitelja zbog bogatog programa i snažne
      organizacije.
    </p>
  </div>
);

const NotFound = () => (
  <div>
    <h2>Stranica nije pronađena!</h2>
    <Link to="/">Povratak na početnu</Link>
  </div>
);

const Footer = () => (
  <footer className="footer">
    <p>&copy; {new Date().getFullYear()} Posuško lito</p>
  </footer>
);

export default App;
