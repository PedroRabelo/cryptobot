import { Outlet } from 'react-router-dom';


export function AppLayout() {
  return (
    <div className="h-full w-full p-4 md:px-8 md:pb-8 md:pt-6 flex flex-col gap-4">
      <header className="h-12 flex items-center justify-between">
        <span className="object-cover max-w-[160px] max-h-[50px]">CryptoBOT </span>

      </header>

      <main className="flex-1 flex max-h-full">
        <Outlet />
      </main>
    </div>
  );
}
