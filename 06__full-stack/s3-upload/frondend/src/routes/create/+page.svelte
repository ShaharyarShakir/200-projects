<script lang="ts">
  const { oncreate = () => {}, onimagechange } = $props<{
    oncreate?: (detail: { formData: FormData }) => void;
    onimagechange?: (file: File | null) => void;
  }>();

  let name = $state("");
  let description = $state("");
  let price = $state<string | number>("");
  let imageFile = $state<File | null>(null);
  let imagePreview = $state<string | null>(null);
  let imageMime = $state<string | null>(null);
  let uploading = $state(false);
  let uploadedFilename = $state<string | null>(null);
  let submitting = $state(false);
  let submitError = $state<string | null>(null);
  let submitSuccess = $state<string | null>(null);

  let errors = $state<{ name?: string; price?: string; image?: string }>({});

  // handle file selection
  const onFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    imageFile = file;
    errors.image = undefined;
    submitError = null;
    submitSuccess = null;
    uploadedFilename = null;
    const mime = file?.type.split("/")[1] ?? "";
    console.log("mime: ", mime);
    uploading = true;
    try {
      const response = await fetch(
        "http://localhost:4000/api/get-presigned-url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mime }),
        },
      );
      if (!response.ok) {
        console.log("Failed to get presigned URL");
        errors.image = "Failed to get upload URL.";
        return;
      }
      const data = await response.json();
      console.log("data:", data);
      const res = await fetch(data.url, {
        method: "PUT",
        headers: {
          "Content-Type": file?.type || "application/octet-stream",
        },
        body: file,
      });
      if (!res.ok) {
        console.log("Failed to upload file");
        errors.image = "Failed to upload image.";
        return;
      }
      console.log("Status:", res.status);
      uploadedFilename = data.finalName ?? null;
    } finally {
      uploading = false;
    }

    if (file) {
      if (!file.type.startsWith("image/")) {
        errors.image = "Please upload an image file.";
        imageFile = null;
        imagePreview = null;
        imageMime = null;
        return;
      }
      try {
        imagePreview = URL.createObjectURL(file);
      } catch {
        imagePreview = null;
      }
      imageMime = mime || null;
    } else {
      imagePreview = null;
      imageMime = null;
    }
    if (typeof onimagechange === "function") onimagechange(imageFile);
  };

  // cleanup previous preview URL when it changes
  $effect(() => {
    // track dependency
    const current = imagePreview;
    if (!current) return;
    return () => {
      try {
        URL.revokeObjectURL(current);
      } catch {}
    };
  });

  // basic validation
  const validate = () => {
    errors = {};
    if (!name.trim()) errors.name = "Product name is required.";
    const p = typeof price === "string" ? price.trim() : String(price);
    if (!p) errors.price = "Price is required.";
    else {
      const n = Number(p);
      if (Number.isNaN(n) || n < 0)
        errors.price = "Enter a valid non-negative number.";
    }

    return Object.keys(errors).length === 0;
  };

  // submit handler
  const onSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validate()) return;
    if (!uploadedFilename) {
      errors.image = "Please select and upload an image.";
      return;
    }

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    fd.append("price", String(price).trim());
    if (imageFile) fd.append("image", imageFile);

    oncreate({ formData: fd });

    console.log("Create product:", {
      name,
      description,
      price,
      imageFileName: imageFile?.name ?? null,
    });
    submitError = null;
    submitSuccess = null;
    submitting = true;
    try {
      const response = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: Number(String(price).trim()),
          filename: uploadedFilename,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        submitError = err?.error || "Failed to create product.";
        return;
      }
      const result = await response.json();
      submitSuccess = "Product created successfully.";
      name = "";
      description = "";
      price = "";
      imageFile = null;
      uploadedFilename = null;
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        imagePreview = null;
      }
      errors = {};
    } finally {
      submitting = false;
    }
  };
</script>

<div class="h-screen mt-10">
  <form
    class="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm"
    onsubmit={onSubmit}
    novalidate
  >
    <h2 class="text-2xl font-semibold mb-4">Create product</h2>
    {#if submitError}
      <p class="mb-3 text-sm text-red-600">{submitError}</p>
    {/if}
    {#if submitSuccess}
      <p class="mb-3 text-sm text-green-600">{submitSuccess}</p>
    {/if}

    <label class="block mb-4">
      <span class="text-sm font-medium text-slate-700">Product name</span>
      <input
        class="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:ring-opacity-50"
        type="text"
        placeholder="e.g. Cozy wool sweater"
        bind:value={name}
        aria-invalid={errors.name ? "true" : "false"}
        aria-describedby={errors.name ? "name-error" : undefined}
        disabled={submitting}
      />
      {#if errors.name}
        <p id="name-error" class="mt-1 text-sm text-red-600">{errors.name}</p>
      {/if}
    </label>

    <label class="block mb-4">
      <span class="text-sm font-medium text-slate-700">Description</span>
      <textarea
        class="mt-1 block w-full rounded-md border px-3 py-2 min-h-24 focus:outline-none focus:ring focus:ring-opacity-50"
        placeholder="Short description of the product"
        bind:value={description}
        disabled={submitting}
      ></textarea>
    </label>
    <label class="block mb-4">
      <span class="text-sm font-medium text-slate-700">Image</span>
      <div class="mt-1 flex items-center gap-4">
        <input
          id="image"
          class="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:cursor-pointer"
          type="file"
          accept="image/*"
          onchange={onFileChange}
          aria-describedby={errors.image ? "image-error" : undefined}
          disabled={uploading || submitting}
        />
      </div>
      {#if errors.image}
        <p id="image-error" class="mt-1 text-sm text-red-600">{errors.image}</p>
      {/if}

      {#if imagePreview}
        <div class="mt-3">
          <span class="block text-sm text-slate-600 mb-2">Preview</span>
          <img
            src={imagePreview}
            alt="Preview of selected file"
            class="w-48 h-48 object-cover rounded-md border"
          />
        </div>
      {/if}
    </label>

    <label class="block mb-6">
      <span class="text-sm font-medium text-slate-700">Price (USD)</span>
      <input
        class="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:ring-opacity-50"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        bind:value={price}
        aria-invalid={errors.price ? "true" : "false"}
        aria-describedby={errors.price ? "price-error" : undefined}
        disabled={submitting}
      />
      {#if errors.price}
        <p id="price-error" class="mt-1 text-sm text-red-600">{errors.price}</p>
      {/if}
    </label>

    <div class="flex items-center gap-3">
      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-md px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring disabled:opacity-50"
        disabled={submitting || uploading}
      >
        {submitting ? "Creating..." : "Create product"}
      </button>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md px-4 py-2 border"
        onclick={() => {
          name = "";
          description = "";
          price = "";
          imageFile = null;
          if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            imagePreview = null;
          }
          errors = {};
          uploadedFilename = null;
          submitError = null;
          submitSuccess = null;
        }}
      >
        Reset
      </button>
    </div>
  </form>
</div>
