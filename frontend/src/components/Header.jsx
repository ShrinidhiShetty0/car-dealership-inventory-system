export default function Header() {
  return (
    <header className="bg-navy-950 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-wide">AutoStock</h1>
        <p className="text-slate-300 text-sm">Car Dealership Inventory Management</p>
      </div>
      <span className="bg-navy-800 text-green-300 text-sm px-3 py-1.5 rounded-full">
        ● Inventory System
      </span>
    </header>
  );
}
