import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import { FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { AiOutlineClose } from 'react-icons/ai';

export default function BuyerHome() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [productsVisible, setProductsVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const skeletonCount = 8;
  const skeletonArray = Array(skeletonCount).fill(0);

  useEffect(() => {
    fetchProducts();
    sessionStorage.removeItem('selectedCategory');
    sessionStorage.removeItem('priceRange');
    sessionStorage.removeItem('sortBy');
    const handlePageRefresh = (event) => {
      if (event.persisted) {
        fetchProducts();
      }
    };
    window.addEventListener('pageshow', handlePageRefresh);
    return () => {
      window.removeEventListener('pageshow', handlePageRefresh);
    };
  }, []);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setProductsVisible(false);
      setImagesLoaded(false);
      const response = await axios.get(`${config.url}/product/viewallproducts`);
      const shuffledProducts = shuffleArray(response.data);
      setData(shuffledProducts);
      setError("");
      setTimeout(() => {
        setLoading(false);
        setProductsVisible(true);
        setTimeout(() => {
          setImagesLoaded(true);
        }, 1500);
      }, 2000);
    } catch (err) {
      setError("Failed to fetch products: " + (err.response?.data || err.message));
      setLoading(false);
    }
  };

  // Stats
  const totalDonations = data.length;
  const activeDonations = data.filter(p => !isProductExpired(p)).length;
  const expiredDonations = data.filter(p => isProductExpired(p)).length;

  // Helper to check if product is expired
  function isProductExpired(product) {
    if (!product.timer || !product.createdAt) return false;
    const created = new Date(product.createdAt);
    const expiresAt = new Date(created.getTime() + product.timer * 60000);
    return new Date() > expiresAt;
  }

  // Unique categories for filter
  const categories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));

  // Filtering
  const filteredData = data
    .filter(product => !isProductExpired(product))
    .filter(product =>
      (!categoryFilter || product.category === categoryFilter) &&
      (product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase()))
    );

  const handleAddToCollectList = (product) => {
    // Add to collection list
    const collectItems = JSON.parse(localStorage.getItem('collectItems')) || [];
    const isProductInList = collectItems.some(item => item.id === product.id);
    if (!isProductInList) {
      const collectItem = {
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.cost,
        addedAt: new Date().toISOString()
      };
      collectItems.push(collectItem);
      localStorage.setItem('collectItems', JSON.stringify(collectItems));
      window.dispatchEvent(new CustomEvent('collectUpdated', { detail: { collectCount: collectItems.length } }));
      toast.success('Added to collection list!');
    } else {
      toast.info('This item is already in your collection list');
    }

    // Also add to cart
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const isProductInCart = cartItems.some(item => item.id === product.id);
    if (!isProductInCart) {
      const cartItem = {
        id: product.id,
        name: product.name,
        category: product.category,
        cost: product.cost,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
      cartItems.push(cartItem);
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartCount: cartItems.length } }));
      // Optionally: toast.success('Added to cart!');
    }
  };

  const handleAddToCart = (product) => {
    // Add to cart logic (same as add to collection list, but for cart)
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const isProductInCart = cartItems.some(item => item.id === product.id);
    if (isProductInCart) {
      toast.info('This item is already in your cart');
      return;
    }
    if (cartItems.length >= 10) {
      toast.error('Cart is full! Maximum 10 items allowed. Please remove some before adding more.');
      return;
    }
    const cartItem = {
      id: product.id,
      name: product.name,
      category: product.category,
      cost: product.cost,
      quantity: 1,
      addedAt: new Date().toISOString()
    };
    cartItems.push(cartItem);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartCount: cartItems.length } }));
    toast.success('Added to cart!');
  };

  const handleRequestCollection = (product, event) => {
    if (event) event.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  const navigateToProductDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-green-800 mb-2">
            {loading ? (
              <div className="h-10 w-64 bg-green-200 rounded-md skeleton-loading"></div>
            ) : (
              "Food Waste Rescue Dashboard"
            )}
          </h2>
          <p className="text-gray-600 text-sm">
            Find and collect surplus food donations to reduce waste and help the community.
          </p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="bg-green-100 rounded-lg px-4 py-2 text-green-800 font-semibold text-center shadow">
            Total: {totalDonations}
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-2 text-green-700 font-semibold text-center shadow">
            Active: {activeDonations}
          </div>
          <div className="bg-red-50 rounded-lg px-4 py-2 text-red-600 font-semibold text-center shadow">
            Expired: {expiredDonations}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search food donations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full sm:w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded shadow-md">
          <p className="text-green-700 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {skeletonArray.map((_, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg overflow-hidden shadow-md border border-green-200 animate-pulse"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-48 bg-green-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-200 via-green-300 to-green-200 skeleton-loading"></div>
              </div>
              <div className="p-4">
                <div className="h-4 w-16 bg-green-200 rounded skeleton-loading mb-2"></div>
                <div className="h-6 bg-green-200 rounded skeleton-loading mb-3"></div>
                <div className="h-4 bg-green-200 rounded skeleton-loading mb-2"></div>
                <div className="h-4 bg-green-200 rounded skeleton-loading mb-4 w-5/6"></div>
                <div className="mt-4 space-y-2">
                  <div className="h-10 bg-green-200 rounded skeleton-loading"></div>
                  <div className="h-10 bg-green-200 rounded skeleton-loading"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No food donations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredData.map((product, index) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 transform ${
                productsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } cursor-pointer animate-fade-in`}
              style={{
                transitionDelay: `${index * 100}ms`,
                transitionDuration: '500ms',
              }}
              onClick={() => navigateToProductDetail(product.id)}
            >
              <div className="relative p-4 bg-gray-100 flex justify-center items-center h-48">
                {imagesLoaded ? (
                  <img 
                    src={`${config.url}/product/displayproductimage?id=${product.id}`} 
                    alt={product.name} 
                    className="max-h-full max-w-full object-contain animate-image-fade-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x200?text=Food+Image";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-gray-400 flex flex-col items-center animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Loading image...</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-content-fade-in">
                  {product.cost} kg
                </div>
                {product.timer && product.createdAt && (
                  <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    Expires: {new Date(new Date(product.createdAt).getTime() + product.timer * 60000).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="p-4 animate-content-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="mb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</p>
                  <h3 className="font-semibold text-gray-800 text-lg truncate" title={product.name}>
                    {product.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                <div className="mt-4 space-y-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.id}`);
                    }}
                    className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition-colors"
                  >
                    Order Food Now
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full bg-white text-green-600 py-2 rounded font-medium border border-green-600 hover:bg-green-50 transition-colors flex items-center justify-center"
                  >
                    <FaShoppingCart className="mr-2" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes contentFadeIn {
          from { opacity: 0.4; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes imageFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-content-fade-in {
          animation: contentFadeIn 0.6s ease-out forwards;
        }
        .animate-image-fade-in {
          animation: imageFadeIn 1s ease-out forwards;
        }
        .skeleton-loading {
          background: linear-gradient(90deg, #e0f7e0 25%, #c8e6c8 50%, #e0f7e0 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}