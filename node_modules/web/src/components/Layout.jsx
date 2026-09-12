import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const isProblemView = location.pathname.startsWith('/problem');

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-[#161512] text-[#f1f0ee] antialiased selection:bg-[#81b64c] selection:text-black ${isProblemView ? 'h-screen overflow-hidden' : ''}`}>
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 ${isProblemView ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <main className={`flex-1 ${isProblemView ? 'h-full overflow-hidden flex flex-col min-h-0' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
