"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProductsAdmin() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    original_price: '',
    badge_text: '',
    badge_color: '#A855F7',
    image_url: '',
  });
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('products_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadProducts();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Yobfesh1325519*') {
      sessionStorage.setItem('products_admin_auth', 'true');
      setIsAuthenticated(true);
      loadProducts();
    } else {
      alert('Incorrect password');
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, folder: string) => {
    if (!file) {
      alert('Please select a file');
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log('Uploading file:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // For private buckets, we need to create a signed URL that expires in 10 years
      const { data, error: urlError } = await supabase.storage
        .from('digital-products')
        .createSignedUrl(filePath, 315360000); // 10 years in seconds

      if (urlError) throw urlError;

      console.log('File uploaded successfully:', data.signedUrl);
      return data.signedUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload ${folder}: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload product file
      if (!productFile) {
        alert('Please select a product file');
        setUploading(false);
        return;
      }
      const fileUrl = await handleFileUpload(productFile, 'products');
      if (!fileUrl) {
        setUploading(false);
        return;
      }

      // Upload image if provided, otherwise use URL
      let imageUrl = formData.image_url;
      if (productImage) {
        const uploadedImageUrl = await handleFileUpload(productImage, 'images');
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      if (!imageUrl) {
        alert('Please provide an image URL or upload an image');
        setUploading(false);
        return;
      }

      // Insert product
      const { error } = await supabase
        .from('digital_products')
        .insert({
          ...formData,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          file_url: fileUrl,
          image_url: imageUrl,
        });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      alert('Product added successfully!');
      setShowAddForm(false);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        price: '',
        original_price: '',
        badge_text: '',
        badge_color: '#A855F7',
        image_url: '',
      });
      setProductFile(null);
      setProductImage(null);
      loadProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`Failed to add product: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('digital_products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const startEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      subtitle: product.subtitle || '',
      description: product.description,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      badge_text: product.badge_text || '',
      badge_color: product.badge_color || '#A855F7',
      image_url: product.image_url,
    });
    setShowAddForm(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload new product file if provided
      let fileUrl = editingProduct.file_url;
      if (productFile) {
        const uploadedFileUrl = await handleFileUpload(productFile, 'products');
        if (uploadedFileUrl) {
          fileUrl = uploadedFileUrl;
        }
      }

      // Upload new image if provided
      let imageUrl = formData.image_url;
      if (productImage) {
        const uploadedImageUrl = await handleFileUpload(productImage, 'images');
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      // Update product
      const { error } = await supabase
        .from('digital_products')
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          badge_text: formData.badge_text,
          badge_color: formData.badge_color,
          file_url: fileUrl,
          image_url: imageUrl,
        })
        .eq('id', editingProduct.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      alert('Product updated successfully!');
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        price: '',
        original_price: '',
        badge_text: '',
        badge_color: '#A855F7',
        image_url: '',
      });
      setProductFile(null);
      setProductImage(null);
      loadProducts();
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(`Failed to update product: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      price: '',
      original_price: '',
      badge_text: '',
      badge_color: '#A855F7',
      image_url: '',
    });
    setProductFile(null);
    setProductImage(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            🛍️ Products Admin
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:opacity-90 transition"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Digital Products Manager</h1>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (showAddForm) {
                  cancelEdit();
                } else {
                  setShowAddForm(true);
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:opacity-90 transition"
            >
              {showAddForm ? 'Cancel' : '+ Add Product'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600 transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        {showAddForm && (
          <div className="bg-gray-800 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <textarea
                placeholder="Description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price *"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Original Price"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Badge Text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold">Product Image</label>
                {editingProduct && (
                  <p className="text-xs text-gray-400 mb-2">Leave empty to keep existing image</p>
                )}
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400">OR</p>
                  <input
                    type="url"
                    placeholder="Image URL (Unsplash)"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold">
                  Product File (PDF, ZIP, etc.) {!editingProduct && '*'}
                </label>
                {editingProduct && (
                  <p className="text-xs text-gray-400 mb-2">Leave empty to keep existing file</p>
                )}
                <input
                  type="file"
                  onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                  required={!editingProduct}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-800 rounded-xl overflow-hidden">
              <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{product.title}</h3>
                {product.subtitle && <p className="text-sm text-purple-400 mb-2">{product.subtitle}</p>}
                <p className="text-sm text-gray-400 mb-3">{product.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-green-400">${product.price}</span>
                  {product.original_price && (
                    <span className="text-sm line-through text-gray-500">${product.original_price}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                    className={`flex-1 py-2 rounded-lg font-semibold ${
                      product.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => startEditProduct(product)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No products yet. Click "Add Product" to get started!
          </div>
        )}
      </div>
    </div>
  );
}

