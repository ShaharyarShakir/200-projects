import Hero from "../components/Hero";
import HeroImg from "../components/HeroImg";
import Navbar from "../components/Navbar";

export default function HomePage() {
    return (
        <div className="flex bg-base-100 h-screen text-base">
            {/* LEFT SIDE */}
            <div className="relative flex flex-col flex-1 p-8 lg:p-12 overflow-hidden">
                <Navbar />
                <Hero />
            </div>

            <HeroImg />
        </div>
    )
}
