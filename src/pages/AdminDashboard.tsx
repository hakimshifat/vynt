/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Edit3, X, Save, LogOut, Package,
  RotateCcw, ShieldCheck, ImagePlus, Tag,
  DollarSign, AlignLeft, Palette, Ruler, Star, Zap, CheckCircle2,
  Upload, Link2, ChevronLeft, ChevronRight, AlertTriangle, Ticket, ToggleLeft, ToggleRight, Percent, Hash,
  ShoppingCart, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { useAdmin } from "../AdminContext";
import { useProducts } from "../ProductContext";
import { useVouchers, Voucher, DiscountType } from "../VoucherContext";
import { useOrders, Order, OrderStatus } from "../OrderContext";
import { Product } from "../types";

const generateId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  category: "Men's Shoes",
  price: 10000,
  image: "",
  description: "",
  colors: ["Black/White"],
  sizes: ["39", "40", "41", "42", "43", "44", "45"],
  gallery: [],
  isNew: false,
  isFeatured: false,
  subtitle: "",
  scarcityMessage: "",
};

const CATEGORIES = ["Men's Shoes", "Men's Running Shoes", "Limited Edition", "Sale"];

// Convert a File to base64 data URL
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ImagePicker: tab between URL input and file upload
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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    // Warn if file > 500KB (base64 bloats ~33%)
    if (file.size > 800_000) {
      alert("⚠️ Image is large (>800KB). It will be stored as base64 in localStorage — consider using a URL instead for better performance.");
    }
    const dataUrl = await fileToDataUrl(file);
    onChange(dataUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const applyUrl = () => {
    if (urlInput.trim()) onChange(urlInput.trim());
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
        <ImagePlus size={10} /> {label}
      </label>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {(["url", "upload"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {t === "url" ? <Link2 size={10} /> : <Upload size={10} />}
            {t === "url" ? "URL" : "Upload"}
          </button>
        ))}
      </div>

      {tab === "url" ? (
        <div className="flex gap-2">
          <input
            className="admin-input flex-grow"
            placeholder={placeholder ?? "https://images.unsplash.com/..."}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } }}
          />
          <button
            type="button"
            onClick={applyUrl}
            className="px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-xl transition-colors shrink-0"
          >
            Set
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragging ? "border-violet-400 bg-violet-500/10" : "border-white/10 hover:border-white/25 hover:bg-white/3"
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          <Upload size={20} className="mx-auto mb-2 text-white/30" />
          <p className="text-xs text-white/40 font-medium">
            Drop an image or <span className="text-violet-400 underline">click to browse</span>
          </p>
          <p className="text-[10px] text-white/20 mt-1">JPG, PNG, WEBP • max ~800KB recommended</p>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative mt-2 w-24 h-24 rounded-xl overflow-hidden border border-white/10 group">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { onChange(""); setUrlInput(""); }}
            className="absolute inset-0 bg-red-500/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X size={14} className="text-white" />
          </button>
          {value.startsWith("data:") && (
            <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-violet-600/80 text-white py-0.5 font-bold">
              LOCAL
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// GalleryPicker: manage gallery images with URL or upload, reorder
interface GalleryPickerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const GalleryPicker: React.FC<GalleryPickerProps> = ({ images, onChange }) => {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput("");
  };

  const handleFiles = async (files: FileList) => {
    const results: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 800_000) {
        alert(`⚠️ "${file.name}" is large (>800KB). Consider using URLs for better performance.`);
      }
      results.push(await fileToDataUrl(file));
    }
    onChange([...images, ...results]);
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  const moveLeft = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  const moveRight = (i: number) => {
    if (i === images.length - 1) return;
    const next = [...images];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
        <ImagePlus size={10} /> Gallery Images
      </label>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {(["url", "upload"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {t === "url" ? <Link2 size={10} /> : <Upload size={10} />}
            {t === "url" ? "Add URL" : "Upload Files"}
          </button>
        ))}
      </div>

      {tab === "url" ? (
        <div className="flex gap-2">
          <input
            className="admin-input flex-grow"
            placeholder="Paste image URL and press Enter or Add"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(); }}}
          />
          <button
            type="button"
            onClick={addUrl}
            className="px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-xl transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-white/10 hover:border-white/25 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-white/3"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); }}
          />
          <Upload size={16} className="mx-auto mb-1 text-white/30" />
          <p className="text-xs text-white/40 font-medium">
            Click to select multiple images from your gallery
          </p>
        </div>
      )}

      {/* Gallery grid with reorder */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/10">
              <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
              {url.startsWith("data:") && (
                <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-violet-600/80 text-white py-0.5 font-bold">
                  LOCAL
                </span>
              )}
              {/* Hover overlay: remove + reorder */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1 bg-red-500/80 rounded-md"
                >
                  <X size={12} className="text-white" />
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveLeft(i)}
                    disabled={i === 0}
                    className="p-1 bg-white/20 rounded-md disabled:opacity-30"
                  >
                    <ChevronLeft size={10} className="text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRight(i)}
                    disabled={i === images.length - 1}
                    className="p-1 bg-white/20 rounded-md disabled:opacity-30"
                  >
                    <ChevronRight size={10} className="text-white" />
                  </button>
                </div>
              </div>
              {/* Index badge */}
              <span className="absolute top-0.5 left-0.5 text-[8px] bg-black/60 text-white/60 rounded px-1 font-bold">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Product Form ──────────────────────────────────────────────────────────────

interface ProductFormProps {
  initial?: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<Product, "id">>(
    initial ? { ...initial, gallery: [...(initial.gallery ?? [])] } : { ...EMPTY_PRODUCT }
  );
  const [colorsInput, setColorsInput] = useState(
    (initial?.colors ?? EMPTY_PRODUCT.colors).join(", ")
  );
  const [sizesInput, setSizesInput] = useState(
    (initial?.sizes ?? EMPTY_PRODUCT.sizes).join(", ")
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.image) { setError("A main image is required."); return; }
    if (!form.price || form.price <= 0) { setError("Enter a valid price."); return; }
    setError("");
    const product: Product = {
      id: initial?.id ?? generateId(),
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      subtitle: form.subtitle?.trim(),
      scarcityMessage: form.scarcityMessage?.trim(),
      colors: colorsInput.split(",").map(s => s.trim()).filter(Boolean),
      sizes: sizesInput.split(",").map(s => s.trim()).filter(Boolean),
    };
    setSaved(true);
    setTimeout(() => onSave(product), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 space-y-6"
    >
      {/* ── Basic Info ─────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Tag size={10} /> Basic Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Product Name</label>
            <input
              className="admin-input"
              placeholder="e.g. Vynt Air Max 2024"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Package size={10} /> Category
            </label>
            <select
              className="admin-input"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign size={10} /> Price (BDT ৳)
            </label>
            <input
              className="admin-input"
              type="number"
              min={0}
              step={100}
              placeholder="e.g. 12000"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            />
          </div>

          {/* Colors */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Palette size={10} /> Colors <span className="text-white/20 normal-case">(comma-separated)</span>
            </label>
            <input
              className="admin-input"
              placeholder="Black/White, Red, Blue"
              value={colorsInput}
              onChange={e => setColorsInput(e.target.value)}
            />
          </div>

          {/* Sizes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Ruler size={10} /> Sizes <span className="text-white/20 normal-case">(comma-separated)</span>
            </label>
            <input
              className="admin-input"
              placeholder="39, 40, 41, 42, 43, 44, 45"
              value={sizesInput}
              onChange={e => setSizesInput(e.target.value)}
            />
          </div>

          {/* Badges */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Star size={10} /> Badges
            </label>
            <div className="flex gap-5 mt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={!!form.isNew}
                  onChange={e => setForm(f => ({ ...f, isNew: e.target.checked }))}
                />
                <span className="text-xs text-white/70 font-semibold">New Arrival</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={!!form.isFeatured}
                  onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                />
                <span className="text-xs text-white/70 font-semibold">Featured</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Description ────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlignLeft size={10} /> Description
        </h2>
        <textarea
          className="admin-input min-h-[80px] resize-y"
          placeholder="Describe the product — materials, technology, style..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div>
        <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlignLeft size={10} /> Subtitle / Short Description
        </h2>
        <input
          className="admin-input"
          placeholder="e.g. Taking inspiration from its predecessor..."
          value={form.subtitle || ""}
          onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
        />
      </div>

      <div>
        <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Ticket size={10} /> Scarcity Message (Optional)
        </h2>
        <input
          className="admin-input"
          placeholder="e.g. Only 3 pairs left in stock!"
          value={form.scarcityMessage || ""}
          onChange={e => setForm(f => ({ ...f, scarcityMessage: e.target.value }))}
        />
      </div>

      {/* ── Images ─────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ImagePlus size={10} /> Images
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Image */}
          <ImagePicker
            label="Main / Cover Image"
            value={form.image}
            onChange={val => setForm(f => ({ ...f, image: val }))}
            placeholder="https://images.unsplash.com/..."
          />

          {/* Gallery */}
          <GalleryPicker
            images={form.gallery ?? []}
            onChange={imgs => setForm(f => ({ ...f, gallery: imgs }))}
          />
        </div>

        {/* Storage warning for base64 heavy usage */}
        {([form.image, ...(form.gallery ?? [])].some(u => u?.startsWith("data:"))) && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-400/90">
              Local images are stored as base64 in your browser's localStorage (~5–10MB limit).
              For best results use image URLs (Unsplash, Imgur, etc.) for large product galleries.
            </p>
          </div>
        )}
      </div>

      {/* ── Error + Buttons ─────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <X size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <X size={14} /> Cancel
        </button>
        <motion.button
          type="button"
          onClick={handleSave}
          animate={saved ? { scale: [1, 1.05, 1] } : {}}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            saved
              ? "bg-green-500 text-white"
              : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20"
          }`}
        >
          {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {saved ? "Saved!" : initial ? "Update Product" : "Add Product"}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Voucher Panel ─────────────────────────────────────────────────────────────

const EMPTY_VOUCHER: Omit<Voucher, "usedCount"> = {
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  active: true,
  usageLimit: 0,
  description: "",
};

const VoucherPanel: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher } = useVouchers();
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [form, setForm] = useState<Omit<Voucher, "usedCount">>(EMPTY_VOUCHER);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setForm(EMPTY_VOUCHER);
    setEditVoucher(null);
    setShowForm(true);
  };

  const openEdit = (v: Voucher) => {
    setForm({ ...v });
    setEditVoucher(v);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.value) return;
    const voucher: Voucher = {
      ...form,
      code: form.code.trim().toUpperCase(),
      usedCount: editVoucher?.usedCount ?? 0,
    };
    if (editVoucher) {
      updateVoucher(voucher);
    } else {
      addVoucher(voucher);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); }, 500);
  };

  const handleDelete = (code: string) => {
    if (deleteConfirm === code) {
      deleteVoucher(code);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(code);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Voucher Codes</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus size={15} /> New Voucher
        </button>
      </div>

      {/* Voucher Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 space-y-4 mb-4"
          >
            <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">
              {editVoucher ? `Editing: ${editVoucher.code}` : "New Voucher"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Hash size={10} /> Code
                </label>
                <input
                  className="admin-input uppercase"
                  placeholder="e.g. VYNT20"
                  value={form.code}
                  disabled={!!editVoucher}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>

              {/* Discount Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Percent size={10} /> Type
                </label>
                <select
                  className="admin-input"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as DiscountType }))}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <DollarSign size={10} /> {form.type === "percent" ? "Discount (%)" : "Discount (৳)"}
                </label>
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  max={form.type === "percent" ? 100 : undefined}
                  placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 500"}
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                />
              </div>

              {/* Min Order */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Tag size={10} /> Min Order (৳) <span className="text-white/20 normal-case">(0 = no min)</span>
                </label>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  step={500}
                  placeholder="e.g. 5000"
                  value={form.minOrder ?? 0}
                  onChange={e => setForm(f => ({ ...f, minOrder: Number(e.target.value) }))}
                />
              </div>

              {/* Usage Limit */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Hash size={10} /> Usage Limit <span className="text-white/20 normal-case">(0 = unlimited)</span>
                </label>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  placeholder="e.g. 100"
                  value={form.usageLimit ?? 0}
                  onChange={e => setForm(f => ({ ...f, usageLimit: Number(e.target.value) }))}
                />
              </div>

              {/* Active toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      form.active
                        ? "bg-green-500/20 border-green-500/40 text-green-400"
                        : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    {form.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {form.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <AlignLeft size={10} /> Description
                </label>
                <input
                  className="admin-input"
                  placeholder="e.g. 20% off on orders above ৳5,000"
                  value={form.description ?? ""}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-5 py-2.5 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <X size={14} /> Cancel
              </button>
              <motion.button
                type="button"
                onClick={handleSave}
                animate={saved ? { scale: [1, 1.05, 1] } : {}}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20"
                }`}
              >
                {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                {saved ? "Saved!" : editVoucher ? "Update Voucher" : "Create Voucher"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher list */}
      <div className="space-y-3">
        <AnimatePresence>
          {vouchers.map((v, i) => (
            <motion.div
              key={v.code}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/4 hover:bg-white/6 border border-white/8 rounded-2xl p-4 flex items-center gap-4 transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                v.active ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/20"
              }`}>
                <Ticket size={18} />
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-white font-mono tracking-widest">{v.code}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    v.active
                      ? "bg-green-500/20 text-green-400 border-green-500/20"
                      : "bg-white/5 text-white/30 border-white/10"
                  }`}>
                    {v.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">
                  {v.type === "percent" ? `${v.value}% off` : `৳${v.value.toLocaleString()} off`}
                  {(v.minOrder ?? 0) > 0 && ` • min ৳${(v.minOrder!).toLocaleString()}`}
                  {(v.usageLimit ?? 0) > 0 && ` • ${v.usedCount}/${v.usageLimit} used`}
                  {(v.usageLimit ?? 0) === 0 && v.usedCount > 0 && ` • used ${v.usedCount}×`}
                </p>
                {v.description && (
                  <p className="text-[10px] text-white/25 mt-0.5 italic">{v.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => updateVoucher({ ...v, active: !v.active })}
                  className={`p-2 rounded-xl transition-all ${
                    v.active
                      ? "text-green-400 hover:bg-green-500/10"
                      : "text-white/20 hover:text-white/50 hover:bg-white/5"
                  }`}
                  title={v.active ? "Deactivate" : "Activate"}
                >
                  {v.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => openEdit(v)}
                  className="p-2 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(v.code)}
                  className={`p-2 rounded-xl transition-all ${
                    deleteConfirm === v.code
                      ? "text-white bg-red-500 scale-105"
                      : "text-white/30 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  title={deleteConfirm === v.code ? "Click again to confirm" : "Delete"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {vouchers.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Ticket size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No vouchers yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Orders Panel ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "text-amber-400 bg-amber-500/15 border-amber-500/30",   icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-400 bg-blue-500/15 border-blue-500/30",     icon: CheckCircle2 },
  shipped:   { label: "Shipped",   color: "text-violet-400 bg-violet-500/15 border-violet-500/30", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-400 bg-green-500/15 border-green-500/30", icon: CheckCircle },
};

const OrdersPanel: React.FC = () => {
  const { orders, ordersLoading, updateOrderStatus } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    await updateOrderStatus(id, status);
    setUpdatingId(null);
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-white/20">
        <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-sm font-bold">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Orders</h1>
        <span className="text-xs text-white/30 font-mono">{orders.length} total</span>
      </div>

      {orders.map((order, i) => {
        const isExpanded = expanded === order.id;
        const sg = STATUS_CONFIG[order.status];
        const StatusIcon = sg.icon;
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden"
          >
            {/* Row */}
            <div
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : order.id)}
            >
              {/* Status badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider shrink-0 ${sg.color}`}>
                <StatusIcon size={10} />
                {sg.label}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-violet-400">{order.id}</span>
                  <span className="text-[10px] text-white/30">
                    {new Date(order.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p className="text-[10px] text-white/30">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""} &bull;
                  {order.paymentMethod === "bkash" ? " bKash" : " Card"}
                  {order.voucherCode ? ` • ${order.voucherCode}` : ""}
                </p>
              </div>

              {/* Total */}
              <div className="text-right shrink-0">
                <p className="text-base font-black text-white">৳{order.total.toLocaleString()}</p>
              </div>

              {/* Expand toggle */}
              <div className="text-white/30">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 border-t border-white/5 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Customer</p>
                        <p className="text-sm font-bold text-white">{order.customer.firstName} {order.customer.lastName}</p>
                        {order.customer.email && <p className="text-xs text-white/50">{order.customer.email}</p>}
                        {order.customer.phone && <p className="text-xs text-white/50">{order.customer.phone}</p>}
                        <p className="text-xs text-white/40">
                          {[order.customer.address1, order.customer.address2, order.customer.city, order.customer.postalCode].filter(Boolean).join(", ")}
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Summary</p>
                        <div className="text-xs text-white/50 space-y-0.5">
                          <div className="flex justify-between"><span>Subtotal</span><span>৳{order.subtotal.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Shipping</span><span>৳{order.shipping.toLocaleString()}</span></div>
                          {order.discount > 0 && <div className="flex justify-between text-green-400"><span>{order.voucherCode}</span><span>−৳{order.discount.toLocaleString()}</span></div>}
                          <div className="flex justify-between font-black text-white pt-1 border-t border-white/10"><span>Total</span><span>৳{order.total.toLocaleString()}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, j) => (
                          <div key={j} className="flex items-center gap-3 bg-white/3 rounded-xl p-2">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                            <div className="flex-grow min-w-0">
                              <p className="text-xs font-bold text-white truncate">{item.name}</p>
                              <p className="text-[10px] text-white/40">Size {item.selectedSize} &bull; {item.selectedColor} &bull; Qty {item.quantity}</p>
                            </div>
                            <p className="text-xs font-black text-violet-400 shrink-0">৳{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status changer */}
                    <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => {
                          const sc = STATUS_CONFIG[s];
                          const Icon = sc.icon;
                          const isActive = order.status === s;
                          const isUpdating = updatingId === order.id;
                          return (
                            <button
                              key={s}
                              onClick={() => !isActive && handleStatusChange(order.id, s)}
                              disabled={isActive || isUpdating}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                isActive
                                  ? sc.color + " scale-105"
                                  : "border-white/10 text-white/30 hover:border-white/25 hover:text-white/60"
                              } disabled:cursor-not-allowed`}
                            >
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
  );
};

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const { isAdmin, logout } = useAdmin();
  const { products, addProduct, updateProduct, deleteProduct, resetToDefaults } = useProducts();
  const { vouchers } = useVouchers();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"products" | "vouchers" | "orders">("products");
  const [mode, setMode] = useState<"list" | "add" | { edit: Product }>("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  React.useEffect(() => {
    if (!isAdmin) navigate("/admin/login");
  }, [isAdmin]);

  const handleSave = (product: Product) => {
    if (mode === "add") {
      addProduct(product);
    } else if (typeof mode === "object" && "edit" in mode) {
      updateProduct(product);
    }
    setMode("list");
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteProduct(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const pageTitle = mode === "list"
    ? "Product Inventory"
    : mode === "add"
    ? "Add New Product"
    : `Editing: ${(mode as { edit: Product }).edit.name}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#111122] text-white">
      {/* Admin Navbar */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 h-[60px] flex items-center px-6">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight">VYNT</span>
              <span className="text-sm font-black text-violet-400 tracking-tight"> Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-white/40 hover:text-white/70 font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              View Store
            </button>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: products.length, icon: Package, color: "from-violet-500 to-purple-600" },
            { label: "Featured", value: products.filter(p => p.isFeatured).length, icon: Star, color: "from-amber-500 to-orange-500" },
            { label: "Vouchers", value: vouchers.length, icon: Ticket, color: "from-emerald-500 to-teal-500" },
            { label: "Orders", value: orders.length, icon: ShoppingCart, color: "from-blue-500 to-cyan-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-6">
          {([
            { key: "products", label: "Products", icon: Package },
            { key: "vouchers", label: "Vouchers", icon: Ticket },
            { key: "orders",   label: "Orders",   icon: ShoppingCart },
          ] as const).map(({ key: t, label, icon: Icon }) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMode("list"); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                tab === t ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Icon size={13} />
              {label}
              {t === "orders" && orders.length > 0 && (
                <span className="ml-0.5 bg-blue-500/30 text-blue-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.status === "pending").length || orders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {mode !== "list" && (
                  <button
                    onClick={() => setMode("list")}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    title="Back to list"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <h1 className="text-xl font-black uppercase tracking-tight text-white">{pageTitle}</h1>
              </div>
              {mode === "list" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReset(!showReset)}
                    className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-all font-medium"
                  >
                    <RotateCcw size={13} /> Reset Defaults
                  </button>
                  <button
                    id="add-product-btn"
                    onClick={() => setMode("add")}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
                  >
                    <Plus size={15} /> Add Product
                  </button>
                </div>
              )}
            </div>

            {/* Reset confirm */}
        <AnimatePresence>
          {showReset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                <p className="text-xs text-red-400 font-medium">
                  Remove all custom products and restore defaults?
                </p>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => setShowReset(false)} className="text-xs text-white/50 px-3 py-1.5 rounded-lg hover:bg-white/5">Cancel</button>
                  <button
                    onClick={() => { resetToDefaults(); setShowReset(false); }}
                    className="text-xs bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence mode="wait">
          {mode !== "list" && (
            <ProductForm
              key={typeof mode === "object" ? mode.edit.id : "add"}
              initial={typeof mode === "object" && "edit" in mode ? mode.edit : undefined}
              onSave={handleSave}
              onCancel={() => setMode("list")}
            />
          )}
        </AnimatePresence>

        {/* Product list */}
        {mode === "list" && (
          <div className="space-y-3">
            <AnimatePresence>
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white/4 hover:bg-white/6 border border-white/8 rounded-2xl p-4 flex items-center gap-4 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/111/fff?text=?"; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white truncate">{product.name}</h3>
                      {product.isNew && (
                        <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
                      )}
                      {product.isFeatured && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Featured</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {product.category} • {product.colors?.join(", ")}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm font-black text-violet-400">৳{product.price.toLocaleString()}</p>
                      {(product.gallery?.length ?? 0) > 0 && (
                        <span className="text-[10px] text-white/25">{product.gallery!.length} gallery img{product.gallery!.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMode({ edit: product })}
                      className="p-2 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                      title="Edit product"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className={`p-2 rounded-xl transition-all ${
                        deleteConfirm === product.id
                          ? "text-white bg-red-500 scale-105"
                          : "text-white/30 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                      title={deleteConfirm === product.id ? "Click again to confirm" : "Delete"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {products.length === 0 && (
              <div className="text-center py-20 text-white/20">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold">No products. Click "Add Product" to start.</p>
              </div>
            )}
          </div>
          )}
        </div>
        )}

        {/* Vouchers tab */}
        {tab === "vouchers" && <VoucherPanel />}

        {/* Orders tab */}
        {tab === "orders" && <OrdersPanel />}

      </div>
    </div>
  );
};

export default AdminDashboard;
