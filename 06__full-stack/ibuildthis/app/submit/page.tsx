import { SparkleIcon } from "lucide-react";
import SectionHeader from "../../components/common/section-header";
import ProductSubmitForm from "@/components/products/product-submit-form";

export default function SubmitPage() {
    return (
        <section className="py-20">
            <div className="wrapper">
                <div className="mb-12">
                    <SectionHeader title="Submit your project" icon={SparkleIcon} description="Share your creation with the community. Your submission will be revised before going live " />
                </div>
                <div className="mx-auto max-w-2xl">
                    <ProductSubmitForm />
                </div>
            </div>
        </section>
    )
}
