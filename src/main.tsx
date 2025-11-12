import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // Make sure to import this

// Get the root element
const root = createRoot(document.getElementById('root')!);

// Render your app
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);