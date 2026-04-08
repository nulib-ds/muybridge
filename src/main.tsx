import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './index.css';
import './styles/index.scss';
import App from './app/App.tsx';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Theme appearance="light" accentColor="gray" grayColor="slate" radius="none">
      <App />
    </Theme>
  </StrictMode>,
);
