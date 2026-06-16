import { Skeleton } from "../ui/skeleton";

export default function ProductSkeleton() {
  return (
    <section className="py-20">
      <div className="wrapper">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="size-6" />
            <Skeleton className="w-64 h-9" />
          </div>
          <Skeleton className="w-96 h-7" />
        </div>

        <div className="grid-wrapper">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="p-6 border rounded-lg min-h-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <Skeleton className="mb-2 w-3/4 h-6" />
                  <Skeleton className="w-full h-4" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-16 h-6" />
                  <Skeleton className="w-20 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}