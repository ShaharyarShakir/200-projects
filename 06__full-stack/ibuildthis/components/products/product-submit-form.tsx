"use client";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FormField } from "../field/form-field";
import { Button } from "../ui/button";
import { LoaderIcon, SparkleIcon } from "lucide-react";

import { useActionState } from "react";
import { addProductAction } from "./product-action";

const initialState = {
  success: false,
  errors: undefined,
  message: "",
};

export default function ProductSubmitForm() {
  const [state, formAction, isPending] = useActionState(addProductAction, initialState);
  const { errors, message, success } = state;
  return (
    <form className="space-y-6" action={formAction}>
      <div className="space-y-2">
        <FormField
          label="Product Name"
          name="name"
          id="name"
          placeholder="My Awesome Product"
          required
          onChange={() => {}}
          error=""
          // error={getFieldErrors("name")}
        />
        <FormField
          label="Slug"
          name="slug"
          id="slug"
          placeholder="my-awesome-product"
          required
          onChange={() => {}}
          helperText="URL-friendly version of your product name"
          error=""
          // error={getFieldErrors("slug")}
        />

        <FormField
          label="Tagline"
          name="tagline"
          id="tagline"
          placeholder="A brief, catchy description"
          required
          onChange={() => {}}
          error=""
          // error={getFieldErrors("tagline")}
        />

        <FormField
          label="Description"
          name="description"
          id="description"
          placeholder="Tell us more about your product..."
          required
          onChange={() => {}}
          error=""
          // error={getFieldErrors("description")}
          textarea
        />

        <FormField
          label="Website URL"
          name="websiteUrl"
          id="websiteUrl"
          placeholder="https://yourproduct.com"
          required
          onChange={() => {}}
          error=""
          // error={getFieldErrors("websiteUrl")}
          helperText="Enter your product's website or landing page"
        />
        <FormField
          label="Tags"
          name="tags"
          id="tags"
          placeholder="AI, Productivity, SaaS"
          required
          error=""
          onChange={() => {}}
          // error={getFieldErrors("tags")}
          helperText="Comma-separated tags (e.g., AI, SaaS, Productivity)"
        />
        {isPending ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <Button className="w-full" type="submit" size={"lg"}>
            <SparkleIcon className="size-4" />
            Submit Product
          </Button>
        )}
      </div>
    </form>
  );
}
