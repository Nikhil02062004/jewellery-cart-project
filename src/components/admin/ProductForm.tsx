import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ProductFormProps = {
  product?: any;
  onSuccess: () => void;
};

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    original_price: product?.original_price || "",
    category: product?.category || "silver",
    gender: product?.gender || "unisex",
    subcategory: product?.subcategory || "",
    image: product?.image || "",
    rating: product?.rating || 0,
    is_new: product?.is_new || false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      price: Number(form.price),
      original_price: form.original_price
        ? Number(form.original_price)
        : null,
    };

    let error;
    if (product?.id) {
      ({ error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required />
      <input name="original_price" type="number" placeholder="Original Price" value={form.original_price} onChange={handleChange} />
      <input name="image" placeholder="Image URL" value={form.image} onChange={handleChange} />

      <select name="category" value={form.category} onChange={handleChange}>
        <option value="silver">Silver</option>
        <option value="gold">Gold</option>
        <option value="artificial">Artificial</option>
      </select>

      <select name="gender" value={form.gender} onChange={handleChange}>
        <option value="unisex">Unisex</option>
        <option value="men">Men</option>
        <option value="women">Women</option>
      </select>

      <input name="subcategory" placeholder="Subcategory (rings, chains…)" value={form.subcategory} onChange={handleChange} />

      <label>
        <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} /> New Product
      </label>

      <button disabled={loading}>
        {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}
