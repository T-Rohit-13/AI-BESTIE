import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { DailyEntryProvider } from './context/DailyEntryContext';
import { CharactersProvider } from './context/CharactersContext';
import { ChatProvider } from './context/ChatContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DailyEntryProvider>
          <CharactersProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </CharactersProvider>
        </DailyEntryProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
