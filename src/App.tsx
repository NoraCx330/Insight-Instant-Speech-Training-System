import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DailyPage } from './pages/DailyPage';
import { ConnectPage } from './pages/ConnectPage';
import { LabPage } from './pages/LabPage';
import { DeepThinkPage } from './pages/DeepThinkPage';
import { TopicsPage } from './pages/TopicsPage';
import { ArchivePage } from './pages/ArchivePage';
import { StoreProvider } from './store/useStore';

function getRoute(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/';
}

function RoutedApp() {
  const [route, setRoute] = useState<string>(getRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(getRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // 去掉查询串后匹配
  const path = route.split('?')[0];

  let page;
  switch (path) {
    case '/daily': page = <DailyPage />; break;
    case '/connect': page = <ConnectPage />; break;
    case '/lab': page = <LabPage />; break;
    case '/deep': page = <DeepThinkPage />; break;
    case '/topics': page = <TopicsPage />; break;
    case '/archive': page = <ArchivePage />; break;
    default: page = <HomePage />;
  }

  return <Layout route={path}>{page}</Layout>;
}

export function App() {
  return (
    <StoreProvider>
      <RoutedApp />
    </StoreProvider>
  );
}
