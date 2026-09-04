import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FieldMap from './components/FieldMap';
import Dashboard from './components/Dashboard';
import Advisories from './components/Advisories';
import Savings from './components/Savings';
import Chatbot from './components/Chatbot';
import Footer from './components/Footer';
import Architecture from './components/Architecture';

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Architecture />
        <FieldMap />
        <Dashboard />
        <Advisories />
        <Savings />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
