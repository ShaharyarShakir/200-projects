import { LoaderIcon } from "lucide-react"

function PageLoader() {
    return (
        <div className="flex justify-center items-center bg-black h-screen">
            <LoaderIcon className="size-12 text-orange-500 animate-spin" />
        </div>
    )
}

export default PageLoader
