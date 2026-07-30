export default function Avatar({ name }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm"
    >
      {initial}
    </div>
  );
}
