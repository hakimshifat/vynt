/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Edit3, X, Save, LogOut, Package,
  RotateCcw, ShieldCheck, ImagePlus, Tag,
  DollarSign, AlignLeft, Palette, Ruler, Star, CheckCircle2,
  Upload, Link2, ChevronLeft, ChevronRight, AlertTriangle,
  Ticket, ToggleLeft, ToggleRight, Percent, Hash,
  ShoppingCart, Clock, Truck, CheckCircle, ChevronDown, ChevronUp,
  Loader2, Store, Menu, ArrowLeft, Zap, BarChart3, Settings,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAdmin } from "../AdminContext";
import { useProducts } from "../ProductContext";
import { useVouchers, Voucher, DiscountType } from "../VoucherContext";
import { useOrders, OrderStatus } from "../OrderContext";
import { useShipping, ShippingConfig } from "../ShippingContext";
import { Product } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "", category: "Men's Shoes", price: 10000, discountedPrice: undefined, image: "",
  description: "", colors: ["Black/White"],
  sizes: ["39", "40", "41", "42", "43", "44", "45"],
  gallery: [], isNew: false, isFeatured: false, subtitle: "", scarcityMessage: "",
};

const CATEGORIES = ["Men's Shoes", "Men's Running Shoes", "Limited Edition", "Sale"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file: File): Promise<string> {
  // Try Supabase Storage first (proper cloud URLs)
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${timestamp}-${safeName}`;
    
    // Use Promise.race to enforce a 10-second timeout on the upload
    const uploadTask = async () => {
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw error;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    };
    
    const timeoutTask = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Storage upload timed out after 10s")), 10000);
    });

    return await Promise.race([uploadTask(), timeoutTask]);
  } catch (err) {
    console.warn("[ImageUpload] Storage upload failed, using data URL fallback:", err);
    // Fallback: convert to base64 data URL and store in Supabase directly
    return fileToDataUrl(file);
  }
}

// ─── Shared UI Atoms ──────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
      <Icon size={11} className="text-violet-400" />
    </div>
    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
  </div>
);

const Field: React.FC<{ label: string; icon?: React.ElementType; children: React.ReactNode; span2?: boolean }> = ({ label, icon: Icon, children, span2 }) => (
  <div className={`space-y-1.5 ${span2 ? "col-span-2" : ""}`}>
    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon size={10} />} {label}
    </label>
    {children}
  </div>
);

const adminInput = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-3.5 py-3 text-sm outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all placeholder-white/20 min-h-[44px]";
const adminSelect = adminInput + " appearance-none cursor-pointer";

// ─── ImagePicker ──────────────────────────────────────────────────────────────

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange, label, placeholder }) => {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [urlInput, setUrlInput] = useState(value.startsWith("data:") ? "" : value);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. Please try again or use a URL.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <SectionLabel icon={ImagePlus} label={label} />
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {(["url", "upload"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${tab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/60"}`}>
            {t === "url" ? <Link2 size={10} /> : <Upload size={10} />}
            {t === "url" ? "URL" : "Upload"}
          </button>
        ))}
      </div>
      {tab === "url" ? (
        <div className="flex gap-2">
          <input className={`${adminInput} flex-grow`} placeholder={placeholder ?? "https://images.unsplash.com/..."}
            value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (urlInput.trim()) onChange(urlInput.trim()); } }} />
          <button type="button" onClick={() => { if (urlInput.trim()) onChange(urlInput.trim()); }}
            className="px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-xl transition-colors shrink-0 min-h-[44px]">Set</button>
        </div>
      ) : (
        <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${uploading ? "border-violet-400 bg-violet-500/10 pointer-events-none" : dragging ? "border-violet-400 bg-violet-500/10" : "border-white/10 hover:border-white/25 cursor-pointer"}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => !uploading && fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          {uploading ? (
            <>
              <Loader2 size={20} className="mx-auto mb-2 text-violet-400 animate-spin" />
              <p className="text-xs text-violet-400 font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <Upload size={20} className="mx-auto mb-2 text-white/30" />
              <p className="text-xs text-white/40 font-medium">Drop or <span className="text-violet-400 underline">browse</span></p>
            </>
          )}
        </div>
      )}
      {value && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
          <img src={value} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <button type="button" onClick={() => { onChange(""); setUrlInput(""); }}
            className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── GalleryPicker ────────────────────────────────────────────────────────────

const GalleryPicker: React.FC<{ images: string[]; onChange: (imgs: string[]) => void }> = ({ images, onChange }) => {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addUrl = () => { if (!urlInput.trim()) return; onChange([...images, urlInput.trim()]); setUrlInput(""); };
  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const results: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        results.push(await uploadImage(file));
      }
      onChange([...images, ...results]);
    } catch (err) {
      console.error("Gallery upload failed:", err);
      alert("Image upload failed. Please try again or use URLs.");
    } finally {
      setUploading(false);
    }
  };
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => { const n = [...images]; [n[i], n[i + dir]] = [n[i + dir], n[i]]; onChange(n); };

  return (
    <div className="space-y-2">
      <SectionLabel icon={ImagePlus} label="Gallery Images" />
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {(["url", "upload"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${tab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/60"}`}>
            {t === "url" ? <Link2 size={10} /> : <Upload size={10} />}
            {t === "url" ? "Add URL" : "Upload"}
          </button>
        ))}
      </div>
      {tab === "url" ? (
        <div className="flex gap-2">
          <input className={`${adminInput} flex-grow`} placeholder="Paste image URL…"
            value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} />
          <button type="button" onClick={addUrl}
            className="px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-xl transition-colors shrink-0 min-h-[44px]">Add</button>
        </div>
      ) : (
        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${uploading ? "border-violet-400 bg-violet-500/10 pointer-events-none" : "border-white/10 hover:border-white/25 cursor-pointer"}`}
          onClick={() => !uploading && fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); }} />
          {uploading ? (
            <>
              <Loader2 size={16} className="mx-auto mb-1 text-violet-400 animate-spin" />
              <p className="text-xs text-violet-400 font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <Upload size={16} className="mx-auto mb-1 text-white/30" />
              <p className="text-xs text-white/40 font-medium">Select images</p>
            </>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((url, i) => (
            <div key={i} className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/10">
              <img src={url} alt={`g-${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button type="button" onClick={() => remove(i)} className="p-1.5 bg-red-500/80 rounded-md"><X size={11} className="text-white" /></button>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 bg-white/20 rounded-md disabled:opacity-30"><ChevronLeft size={10} className="text-white" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="p-1 bg-white/20 rounded-md disabled:opacity-30"><ChevronRight size={10} className="text-white" /></button>
                </div>
              </div>
              <span className="absolute top-0.5 left-0.5 text-[8px] bg-black/60 text-white/60 rounded px-1 font-bold">{i + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Product Form (Slide-up drawer on mobile) ─────────────────────────────────

interface ProductFormProps {
  initial?: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<Product, "id">>(
    initial ? { ...initial, gallery: [...(initial.gallery ?? [])] } : { ...EMPTY_PRODUCT }
  );
  const [colorsInput, setColorsInput] = useState((initial?.colors ?? EMPTY_PRODUCT.colors).join(", "));
  const [sizesInput, setSizesInput] = useState((initial?.sizes ?? EMPTY_PRODUCT.sizes).join(", "));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.image) { setError("A main image is required."); return; }
    if (!form.price || form.price <= 0) { setError("Enter a valid price."); return; }
    setError("");
    const product: Product = {
      id: initial?.id ?? generateId(), ...form,
      name: form.name.trim(), description: form.description.trim(),
      subtitle: form.subtitle?.trim(), scarcityMessage: form.scarcityMessage?.trim(),
      colors: colorsInput.split(",").map(s => s.trim()).filter(Boolean),
      sizes: sizesInput.split(",").map(s => s.trim()).filter(Boolean),
    };
    setSaved(true);
    setTimeout(() => onSave(product), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#0d0d1c] border border-white/8 rounded-2xl overflow-hidden"
    >
      {/* Form Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/3">
        <h2 className="text-sm font-black text-white tracking-tight">
          {initial ? `✏️ Edit: ${initial.name.split(" ").slice(0, 3).join(" ")}` : "➕ New Product"}
        </h2>
        <button type="button" onClick={onCancel}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <X size={16} className="text-white/60" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Basic Info */}
        <div>
          <SectionLabel icon={Tag} label="Basic Info" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product Name" span2>
              <input className={adminInput} placeholder="e.g. Vynt Air Max 2025"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Category" icon={Package}>
              <select className={adminSelect} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price (৳) BDT" icon={DollarSign}>
              <input className={adminInput} type="number" min={0} step={100} placeholder="12000"
                value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </Field>
            <Field label="Discounted Price (৳)" icon={DollarSign}>
              <input className={adminInput} type="number" min={0} step={100} placeholder="Leave empty if no discount"
                value={form.discountedPrice ?? ""} onChange={e => setForm(f => ({ ...f, discountedPrice: e.target.value ? Number(e.target.value) : undefined }))} />
            </Field>
            <Field label="Colors (comma sep.)" icon={Palette} span2>
              <input className={adminInput} placeholder="Black/White, Red, Blue"
                value={colorsInput} onChange={e => setColorsInput(e.target.value)} />
            </Field>
            <Field label="Sizes (comma sep.)" icon={Ruler} span2>
              <input className={adminInput} placeholder="39, 40, 41, 42, 43"
                value={sizesInput} onChange={e => setSizesInput(e.target.value)} />
            </Field>
            {/* Badges */}
            <div className="col-span-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Star size={10} /> Badges</label>
              <div className="flex gap-3">
                {[
                  { key: "isNew" as const, label: "New Arrival" },
                  { key: "isFeatured" as const, label: "Featured" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none bg-white/5 hover:bg-white/8 rounded-xl px-4 py-2.5 transition-colors border border-white/8">
                    <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-violet-500" />
                    <span className="text-xs text-white/70 font-semibold">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <SectionLabel icon={AlignLeft} label="Content" />
          <div className="space-y-3">
            <Field label="Main Description">
              <textarea className={`${adminInput} min-h-[80px] resize-y`}
                placeholder="Describe the product…" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>
            <Field label="Subtitle / Short Description">
              <input className={adminInput} placeholder="e.g. Taking inspiration from…"
                value={form.subtitle || ""} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            </Field>
            <Field label="Scarcity Message (optional)" icon={Zap}>
              <input className={adminInput} placeholder="e.g. Only 3 pairs left!"
                value={form.scarcityMessage || ""} onChange={e => setForm(f => ({ ...f, scarcityMessage: e.target.value }))} />
            </Field>
          </div>
        </div>

        {/* Images */}
        <div>
          <SectionLabel icon={ImagePlus} label="Images" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ImagePicker label="Main / Cover Image" value={form.image}
              onChange={val => setForm(f => ({ ...f, image: val }))} />
            <GalleryPicker images={form.gallery ?? []}
              onChange={imgs => setForm(f => ({ ...f, gallery: imgs }))} />
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <X size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1 border-t border-white/6">
          <button type="button" onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/8 rounded-xl hover:bg-white/5 transition-all">
            <X size={14} /> Cancel
          </button>
          <motion.button type="button" onClick={handleSave}
            animate={saved ? { scale: [1, 1.04, 1] } : {}}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              saved ? "bg-green-500 text-white" : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25"
            }`}>
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? "Saved!" : initial ? "Update" : "Add Product"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Products Panel ───────────────────────────────────────────────────────────

const EMPTY_VOUCHER: Omit<Voucher, "usedCount"> = {
  code: "", type: "percent", value: 10, minOrder: 0,
  active: true, usageLimit: 0, description: "",
};

const ProductsPanel: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, resetToDefaults } = useProducts();
  const [mode, setMode] = useState<"list" | "add" | { edit: Product }>("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const handleSave = (product: Product) => {
    if (mode === "add") addProduct(product);
    else if (typeof mode === "object" && "edit" in mode) updateProduct(product);
    setMode("list");
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) { deleteProduct(id); setDeleteConfirm(null); }
    else { setDeleteConfirm(id); setTimeout(() => setDeleteConfirm(null), 3000); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode !== "list" && (
            <button onClick={() => setMode("list")}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} className="text-white/60" />
            </button>
          )}
          <h2 className="text-base font-black text-white uppercase tracking-tight">
            {mode === "list" ? "Products" : mode === "add" ? "Add Product" : "Edit Product"}
          </h2>
        </div>
        {mode === "list" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReset(!showReset)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
              <RotateCcw size={15} />
            </button>
            <button id="add-product-btn" onClick={() => setMode("add")}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all">
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </div>

      {/* Reset confirm */}
      <AnimatePresence>
        {showReset && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
              <p className="text-xs text-red-400 font-medium">Restore all default products?</p>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setShowReset(false)} className="text-xs text-white/40 px-3 py-2 rounded-lg hover:bg-white/5 font-medium">Cancel</button>
                <button onClick={() => { resetToDefaults(); setShowReset(false); }}
                  className="text-xs bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-lg transition-colors">Reset</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence mode="wait">
        {mode !== "list" && (
          <ProductForm key={typeof mode === "object" ? mode.edit.id : "add"}
            initial={typeof mode === "object" && "edit" in mode ? mode.edit : undefined}
            onSave={handleSave} onCancel={() => setMode("list")} />
        )}
      </AnimatePresence>

      {/* Product list */}
      {mode === "list" && (
        <div className="space-y-2.5">
          <AnimatePresence>
            {products.map((product, i) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white/4 hover:bg-white/6 border border-white/8 rounded-2xl p-3 flex items-center gap-3 transition-colors group">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/56x56/111/555?text=?"; }} />
                </div>
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-black text-white truncate">{product.name}</h3>
                    {product.isNew && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-black uppercase">New</span>}
                    {product.isFeatured && <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-black uppercase">★</span>}
                  </div>
                  <p className="text-[10px] text-white/35 mt-0.5 truncate">{product.category}</p>
                  {product.discountedPrice && product.discountedPrice < product.price ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs font-medium text-white/30 line-through">৳{product.price.toLocaleString()}</p>
                      <p className="text-sm font-black text-red-400">৳{product.discountedPrice.toLocaleString()}</p>
                      <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-black uppercase">
                        {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-black text-violet-400 mt-0.5">৳{product.price.toLocaleString()}</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setMode({ edit: product })}
                    className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(product.id)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${deleteConfirm === product.id ? "text-white bg-red-500 scale-110" : "text-white/30 hover:text-red-400 hover:bg-red-500/10"}`}
                    title={deleteConfirm === product.id ? "Tap again to confirm" : "Delete"}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {products.length === 0 && (
            <div className="text-center py-16 text-white/20">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">No products yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Voucher Panel ────────────────────────────────────────────────────────────

const VoucherPanel: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher } = useVouchers();
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [form, setForm] = useState<Omit<Voucher, "usedCount">>(EMPTY_VOUCHER);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => { setForm(EMPTY_VOUCHER); setEditVoucher(null); setShowForm(true); };
  const openEdit = (v: Voucher) => { setForm({ ...v }); setEditVoucher(v); setShowForm(true); };
  const handleSave = () => {
    if (!form.code.trim() || !form.value) return;
    const voucher: Voucher = { ...form, code: form.code.trim().toUpperCase(), usedCount: editVoucher?.usedCount ?? 0 };
    if (editVoucher) updateVoucher(editVoucher.code, voucher); else addVoucher(voucher);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); }, 500);
  };
  const handleDelete = (code: string) => {
    if (deleteConfirm === code) { deleteVoucher(code); setDeleteConfirm(null); }
    else { setDeleteConfirm(code); setTimeout(() => setDeleteConfirm(null), 3000); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white uppercase tracking-tight">Vouchers</h2>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all">
          <Plus size={14} /> New
        </button>
      </div>

      {/* Voucher Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-[#0d0d1c] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/3">
              <h3 className="text-sm font-black text-white">{editVoucher ? `Edit: ${editVoucher.code}` : "New Voucher"}</h3>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X size={16} className="text-white/60" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="Code" icon={Hash}>
                  <input className={`${adminInput} uppercase`} placeholder="VYNT20"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="Type" icon={Percent}>
                  <select className={adminSelect} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DiscountType }))}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </Field>
                <Field label={form.type === "percent" ? "Discount (%)" : "Discount (৳)"} icon={DollarSign}>
                  <input className={adminInput} type="number" min={1} max={form.type === "percent" ? 100 : undefined}
                    placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 500"} value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
                </Field>
                <Field label="Min Order (৳)" icon={Tag}>
                  <input className={adminInput} type="number" min={0} step={500} placeholder="5000"
                    value={form.minOrder ?? 0} onChange={e => setForm(f => ({ ...f, minOrder: Number(e.target.value) }))} />
                </Field>
                <Field label="Usage Limit (0=∞)" icon={Hash}>
                  <input className={adminInput} type="number" min={0} placeholder="100"
                    value={form.usageLimit ?? 0} onChange={e => setForm(f => ({ ...f, usageLimit: Number(e.target.value) }))} />
                </Field>
                <Field label="Status">
                  <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                    className={`min-h-[44px] w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${form.active ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                    {form.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {form.active ? "Active" : "Inactive"}
                  </button>
                </Field>
                <Field label="Description" icon={AlignLeft} span2>
                  <input className={adminInput} placeholder="e.g. 20% off on orders above ৳5,000"
                    value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Field>
              </div>
              <div className="flex gap-3 pt-3 border-t border-white/6">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white/50 text-xs font-bold uppercase border border-white/8 rounded-xl hover:bg-white/5 transition-all">
                  <X size={14} /> Cancel
                </button>
                <motion.button type="button" onClick={handleSave} animate={saved ? { scale: [1, 1.04, 1] } : {}}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${saved ? "bg-green-500 text-white" : "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20"}`}>
                  {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                  {saved ? "Saved!" : editVoucher ? "Update" : "Create"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher list */}
      <div className="space-y-2.5">
        {vouchers.map((v, i) => (
          <motion.div key={v.code} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
            {/* Badge */}
            <div className={`shrink-0 px-3 py-2 rounded-xl text-center min-w-[70px] ${v.active ? "bg-violet-500/15 border border-violet-500/25" : "bg-white/5 border border-white/10"}`}>
              <p className={`text-xs font-black tracking-wider ${v.active ? "text-violet-300" : "text-white/30"}`}>{v.code}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${v.active ? "text-violet-400" : "text-white/20"}`}>
                {v.type === "percent" ? `${v.value}%` : `৳${v.value}`}
              </p>
            </div>
            {/* Info */}
            <div className="flex-grow min-w-0">
              <p className="text-xs text-white/70 font-medium truncate">{v.description || "—"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${v.active ? "text-green-400 bg-green-500/15 border-green-500/25" : "text-white/25 bg-white/5 border-white/10"}`}>
                  {v.active ? "ACTIVE" : "OFF"}
                </span>
                {(v.usageLimit ?? 0) > 0 && (
                  <span className="text-[9px] text-white/30 font-mono">{v.usedCount}/{v.usageLimit} used</span>
                )}
                {v.minOrder && <span className="text-[9px] text-white/25">min ৳{v.minOrder.toLocaleString()}</span>}
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(v)}
                className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all">
                <Edit3 size={15} />
              </button>
              <button onClick={() => handleDelete(v.code)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${deleteConfirm === v.code ? "text-white bg-red-500 scale-110" : "text-white/30 hover:text-red-400 hover:bg-red-500/10"}`}>
                <Trash2 size={15} />
              </button>
            </div>
          </motion.div>
        ))}
        {vouchers.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Ticket size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No vouchers yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Orders Panel ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/30",   icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/30",     icon: CheckCircle2 },
  shipped:   { label: "Shipped",   color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/30", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30",   icon: CheckCircle },
};

const OrdersPanel: React.FC = () => {
  const { orders, ordersLoading, updateOrderStatus } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    await updateOrderStatus(id, status);
    setUpdatingId(null);
  };

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  if (ordersLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-white/30" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white uppercase tracking-tight">Orders</h2>
        <span className="text-xs text-white/30 font-mono bg-white/5 px-2.5 py-1 rounded-lg">{orders.length} total</span>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "pending", "confirmed", "shipped", "delivered"] as const).map(s => {
          const isAll = s === "all";
          const cfg = !isAll ? STATUS_CONFIG[s] : null;
          const count = isAll ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${statusFilter === s ? (cfg ? `${cfg.color} ${cfg.bg}` : "text-white bg-white/10 border-white/20") : "text-white/30 border-white/8 hover:border-white/20 hover:text-white/50"}`}>
              {cfg && <cfg.icon size={9} />}
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
              <span className="ml-0.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/20">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">{statusFilter === "all" ? "No orders yet." : `No ${statusFilter} orders.`}</p>
        </div>
      )}

      <div className="space-y-2.5">
        {filtered.map((order, i) => {
          const isExpanded = expanded === order.id;
          const sg = STATUS_CONFIG[order.status];
          const StatusIcon = sg.icon;
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
              className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
              {/* Row */}
              <div className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                {/* Status pill */}
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider shrink-0 ${sg.color} ${sg.bg}`}>
                  <StatusIcon size={9} /> {sg.label}
                </div>
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-mono text-violet-400/80 truncate">{order.id}</span>
                    <span className="text-[9px] text-white/25 shrink-0">
                      {new Date(order.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">{order.customer.firstName} {order.customer.lastName}</p>
                  <p className="text-[10px] text-white/30">{order.items.length} item{order.items.length !== 1 ? "s" : ""} • {order.paymentMethod === "bkash" ? "bKash" : order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}</p>
                </div>
                {/* Total + expand */}
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-black text-white">৳{order.total.toLocaleString()}</p>
                  <div className="text-white/30">{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-3 border-t border-white/6 space-y-4">
                      {/* Customer + Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/3 rounded-xl p-3 space-y-1">
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">Customer</p>
                          <p className="text-sm font-bold text-white">{order.customer.firstName} {order.customer.lastName}</p>
                          {order.customer.email && <p className="text-xs text-white/50">{order.customer.email}</p>}
                          {order.customer.phone && <p className="text-xs text-white/50">{order.customer.phone}</p>}
                          <p className="text-xs text-white/35">{[order.customer.address1, order.customer.address2, order.customer.city, order.customer.postalCode].filter(Boolean).join(", ")}</p>
                        </div>
                        <div className="bg-white/3 rounded-xl p-3">
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">Summary</p>
                          <div className="text-xs text-white/50 space-y-0.5">
                            <div className="flex justify-between"><span>Subtotal</span><span>৳{order.subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Shipping</span><span>৳{order.shipping.toLocaleString()}</span></div>
                            {order.discount > 0 && <div className="flex justify-between text-green-400"><span>{order.voucherCode}</span><span>−৳{order.discount.toLocaleString()}</span></div>}
                            <div className="flex justify-between font-black text-white pt-1 border-t border-white/10"><span>Total</span><span>৳{order.total.toLocaleString()}</span></div>
                            {order.transactionId && (
                              <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-widest text-[#e2136e] font-black">bKash TxID</span>
                                <span className="font-mono text-[#e2136e] text-xs font-bold bg-[#e2136e]/10 px-1.5 py-0.5 rounded">{order.transactionId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Items</p>
                        <div className="space-y-2">
                          {order.items.map((item, j) => (
                            <div key={j} className="flex items-center gap-3 bg-white/3 rounded-xl p-2.5">
                              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-grow min-w-0">
                                <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                <p className="text-[10px] text-white/40">Sz {item.selectedSize} · {item.selectedColor} · ×{item.quantity}</p>
                              </div>
                              <p className="text-xs font-black text-violet-400 shrink-0">৳{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status updater */}
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => {
                            const sc = STATUS_CONFIG[s];
                            const Icon = sc.icon;
                            const isActive = order.status === s;
                            const isUpdating = updatingId === order.id;
                            return (
                              <button key={s} onClick={() => !isActive && handleStatusChange(order.id, s)}
                                disabled={isActive || isUpdating}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isActive ? `${sc.color} ${sc.bg} scale-105` : "border-white/10 text-white/30 hover:border-white/25 hover:text-white/60"} disabled:cursor-not-allowed`}>
                                {isUpdating && !isActive ? <Loader2 size={10} className="animate-spin" /> : <Icon size={10} />}
                                {sc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Settings Panel (Shipping) ────────────────────────────────────────────────

const SettingsPanel: React.FC = () => {
  const { shipping, updateShipping } = useShipping();
  const [form, setForm] = useState<ShippingConfig>({ ...shipping });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateShipping(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-black text-white uppercase tracking-tight">Settings</h2>

      {/* Shipping Costs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d0d1c] border border-white/8 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Truck size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">Shipping Costs</h3>
              <p className="text-[10px] text-white/35 font-medium">Set delivery charges for Inside & Outside Dhaka</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Truck size={10} /> Inside Dhaka (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/30 font-bold">৳</span>
                <input
                  className={`${adminInput} pl-8`}
                  type="number"
                  min={0}
                  step={10}
                  placeholder="80"
                  value={form.insideDhaka}
                  onChange={e => setForm(f => ({ ...f, insideDhaka: Number(e.target.value) }))}
                />
              </div>
              <p className="text-[10px] text-white/25 font-medium">Delivery within Dhaka city (1–2 days)</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Truck size={10} /> Outside Dhaka (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/30 font-bold">৳</span>
                <input
                  className={`${adminInput} pl-8`}
                  type="number"
                  min={0}
                  step={10}
                  placeholder="150"
                  value={form.outsideDhaka}
                  onChange={e => setForm(f => ({ ...f, outsideDhaka: Number(e.target.value) }))}
                />
              </div>
              <p className="text-[10px] text-white/25 font-medium">Delivery outside Dhaka (3–5 days)</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white/3 border border-white/6 rounded-xl p-4">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Preview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Inside Dhaka</p>
                <p className="text-lg font-black text-emerald-400 mt-1">৳{form.insideDhaka.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Outside Dhaka</p>
                <p className="text-lg font-black text-blue-400 mt-1">৳{form.outsideDhaka.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2 border-t border-white/6">
            <motion.button
              type="button"
              onClick={handleSave}
              animate={saved ? { scale: [1, 1.04, 1] } : {}}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25"
              }`}
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saved ? "Saved!" : "Save Shipping"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

type Tab = "products" | "vouchers" | "orders" | "settings";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "products", label: "Products", icon: Package },
  { key: "vouchers", label: "Vouchers", icon: Ticket },
  { key: "orders",   label: "Orders",   icon: ShoppingCart },
  { key: "settings", label: "Settings", icon: Settings },
];

const AdminDashboard: React.FC = () => {
  const { isAdmin, logout } = useAdmin();
  const { products } = useProducts();
  const { vouchers } = useVouchers();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [menuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!isAdmin) navigate("/admin/login");
  }, [isAdmin]);

  const pendingOrders = orders.filter(o => o.status === "pending").length;

  const stats = [
    { label: "Products", value: products.length, icon: Package, gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/25" },
    { label: "Featured", value: products.filter(p => p.isFeatured).length, icon: Star, gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/25" },
    { label: "Vouchers", value: vouchers.length, icon: Ticket, gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/25" },
    { label: "Orders", value: orders.length, icon: BarChart3, gradient: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/25" },
  ];

  return (
    <div className="min-h-screen min-h-dvh bg-[#080810] text-white">
      {/* ── Background decoration ─────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* ── Top Navbar ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div className="leading-none">
              <span className="text-sm font-black text-white tracking-tight">VYNT</span>
              <span className="text-sm font-black text-violet-400 tracking-tight"> Admin</span>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-medium px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
              <Store size={14} /> View Store
            </button>
            <button onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 font-bold px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all">
              <LogOut size={14} /> Logout
            </button>
          </div>

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors">
            {menuOpen ? <X size={18} className="text-white/70" /> : <Menu size={18} className="text-white/70" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden border-t border-white/6">
              <div className="px-4 py-3 space-y-1">
                <button onClick={() => { navigate("/"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  <Store size={16} /> View Store
                </button>
                <button onClick={() => { logout(); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pt-6 pb-28 sm:pb-10">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => { const map: Record<string, Tab> = { Products: "products", Featured: "products", Vouchers: "vouchers", Orders: "orders" }; if (map[s.label]) setTab(map[s.label]); }}
              className="bg-white/4 hover:bg-white/6 border border-white/8 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all group">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center shrink-0 shadow-lg ${s.glow} group-hover:scale-105 transition-transform`}>
                <s.icon size={17} className="text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-[10px] text-white/35 font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Desktop tab bar ─── */}
        <div className="hidden sm:flex gap-1 bg-white/4 border border-white/8 rounded-2xl p-1 mb-6 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60 hover:bg-white/5"}`}>
              <Icon size={13} /> {label}
              {key === "orders" && pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{pendingOrders}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {tab === "products" && <ProductsPanel />}
            {tab === "vouchers" && <VoucherPanel />}
            {tab === "orders" && <OrdersPanel />}
            {tab === "settings" && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        {/* Blur backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl border-t border-white/8" />
        <div className="relative flex items-center justify-around px-2 py-2 pb-safe-area">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}>
                {key === "orders" && pendingOrders > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-blue-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{pendingOrders}</span>
                )}
                <motion.div animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}>
                  <Icon size={20} className={isActive ? "text-violet-400" : "text-white/35"} />
                </motion.div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-violet-400" : "text-white/30"}`}>{label}</span>
                {isActive && <motion.div layoutId="tab-indicator" className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-violet-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
