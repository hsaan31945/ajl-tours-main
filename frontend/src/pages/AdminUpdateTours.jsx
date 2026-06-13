import React, { useCallback, useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import TourEditWizard from "../components/TourEditWizard";
import { getTourId } from "../utils/tourId";
import { apiUrl } from "../utils/api";
import { normalizeTourData } from "../utils/tourDataMapper";
import { AdminCard, AdminPage, Alert, EmptyState, LoadingState, StatusBadge } from "../components/admin/AdminUI";
import { money } from "../utils/adminApi";

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getDiscountPercentFromPrice = (price, discountedPrice) => {
  const basePrice = Number(price);
  const salePrice = Number(discountedPrice);
  if (!Number.isFinite(basePrice) || basePrice <= 0 || !Number.isFinite(salePrice) || salePrice < 0 || salePrice >= basePrice) {
    return null;
  }
  return roundMoney(((basePrice - salePrice) / basePrice) * 100);
};

const getPriceAfterPercent = (price, percent) => {
  const basePrice = Number(price);
  const discountPercent = Number(percent);
  if (!Number.isFinite(basePrice) || basePrice < 0 || !Number.isFinite(discountPercent) || discountPercent <= 0) {
    return null;
  }
  return roundMoney(Math.max(0, basePrice * (1 - Math.min(100, discountPercent) / 100)));
};

const AdminUpdateTours = () => {
  const { isAdmin, passcodeHeader, getAuthHeader } = useAdmin();
  const [tours, setTours] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTour, setEditingTour] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchTours = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(apiUrl('/api/tours?full=true'), {
        headers: getAuthHeader ? getAuthHeader() : { 'X-Admin-Passcode': passcodeHeader || '' },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setTours(Array.isArray(data) ? data.map(normalizeTourData) : []);
      } else {
        throw new Error('Could not load tours');
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      setError(error.message || 'Could not load tours');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, passcodeHeader]);

  useEffect(() => {
    if (isAdmin) {
      fetchTours();
    }
  }, [fetchTours, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchDivisions = async () => {
      try {
        const res = await fetch(apiUrl('/api/divisions'), { cache: 'no-store' });
        const data = await res.json();
        setDivisions(Array.isArray(data) ? data : []);
      } catch {
        setDivisions([]);
      }
    };
    fetchDivisions();
  }, [isAdmin]);

  const handleEditClick = (tour) => {
    setEditingTour(tour);
  };

  const handleSaveTour = async (savedTour) => {
    try {
      const savedRecord = savedTour?.tour || savedTour;
      const normalizedSavedRecord = normalizeTourData(savedRecord);
      // savedTour is already the response from the API (saved in database)
      // No need to make another API call - just update local state
      console.log('Handling saved tour:', normalizedSavedRecord);
      
      // Update the tours list with the saved tour from database
      setTours((currentTours) => currentTours.map(tour => {
        const tourId = getTourId(tour);
        const savedTourId = getTourId(normalizedSavedRecord);
        return (tourId === savedTourId || tourId?.toString() === savedTourId?.toString()) ? normalizedSavedRecord : tour;
      }));
      setEditingTour(null); // Close the wizard
      
      // Refresh the list from server to ensure data consistency
      await fetchTours();
      
      // Show success message
      setMessage('Tour updated successfully.');
    } catch (error) {
      console.error('Error handling saved tour:', error);
      setError('Error updating tour list: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingTour(null);
  };

  const handleDeleteTour = async (tour) => {
    const tourId = getTourId(tour);
    if (!window.confirm(`Are you sure you want to delete "${tour.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/tours/${tourId}`), {
        method: 'DELETE',
        headers: getAuthHeader ? getAuthHeader() : { 'X-Admin-Passcode': passcodeHeader || '' }
      });
      
      if (response.ok) {
        // Remove from local state
        setTours((currentTours) => currentTours.filter(t => getTourId(t)?.toString() !== tourId?.toString()));
        setMessage('Tour deleted successfully.');
      } else {
        const data = await response.json();
        setError(`Failed to delete tour: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
      setError('Error deleting tour: ' + error.message);
    }
  };

  const getDestinationName = (tour) => {
    if (typeof tour.division === 'object' && tour.division?.name) return tour.division.name;
    if (typeof tour.divisionName === 'object' && tour.divisionName?.name) return tour.divisionName.name;
    if (typeof tour.divisionName === 'string') return tour.divisionName;
    const division = divisions.find((item) => (item._id || item.id) === tour.division);
    return division?.name || tour.destination || 'N/A';
  };

  const handleStatusToggle = async (tour) => {
    const tourId = getTourId(tour);
    const nextActive = tour.isActive === false;
    setError("");
    setMessage("");
    try {
      const response = await fetch(apiUrl(`/api/tours/${tourId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeader ? getAuthHeader() : { 'X-Admin-Passcode': passcodeHeader || '' }),
        },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Could not update status');
      setTours((current) => current.map((item) => (
        getTourId(item) === tourId ? { ...item, isActive: nextActive } : item
      )));
      setMessage(`Tour marked ${nextActive ? 'active' : 'inactive'}.`);
    } catch (err) {
      setError(err.message || 'Could not update tour status');
    }
  };

  const filteredTours = tours.filter((tour) => {
    const destinationName = getDestinationName(tour);
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destinationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDestination = destinationFilter === 'all' || destinationName === destinationFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? tour.isActive !== false : tour.isActive === false);
    return matchesSearch && matchesDestination && matchesStatus;
  });

  if (!isAdmin) {
    return <LoadingState label="Checking admin access..." />;
  }

  return (
    <AdminPage title="Manage Tours" description="Search, edit, activate, deactivate, and delete live tours.">
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}
        
        {/* Search Bar */}
        <AdminCard className="mb-6">
          <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search tours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          <select value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)} className="rounded-lg border border-gray-300 p-3">
            <option value="all">All destinations</option>
            {[...new Set(tours.map(getDestinationName))].filter(Boolean).map((destination) => (
              <option key={destination} value={destination}>{destination}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-300 p-3">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          </div>
        </AdminCard>

        {loading ? (
          <LoadingState label="Loading tours..." />
        ) : editingTour ? (
          <AdminCard>
            <h2 className="text-xl font-semibold mb-4">Editing: {editingTour.name}</h2>
            <TourEditWizard 
              initialTourData={editingTour}
              tour={editingTour} 
              isOpen={!!editingTour}
              onSave={handleSaveTour} 
              onClose={handleCancelEdit}
            />
          </AdminCard>
        ) : (
          <AdminCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTours.map((tour) => {
                    const discountPercent = getDiscountPercentFromPrice(tour.price, tour.discountPrice);
                    const hasRegularDiscount = Number.isFinite(Number(tour.discountPrice)) && Number(tour.discountPrice) > 0 && Number(tour.discountPrice) < Number(tour.price);
                    const groupBasePrice = hasRegularDiscount
                      ? Number(tour.discountPrice)
                      : Number(tour.price || 0);
                    return (
                    <tr key={getTourId(tour)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getDestinationName(tour)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tour.discountEnabled && Number(tour.discountPrice) < Number(tour.price) ? (
                            <>
                              <span className="text-gray-400 line-through mr-2">{money(tour.price || 0)}</span>
                              <span className="font-semibold text-red-600">{money(tour.discountPrice || 0)}</span>
                              {discountPercent !== null && (
                                <span className="ml-2 text-xs text-gray-500">({discountPercent}% off)</span>
                              )}
                            </>
                          ) : (
                            <>{money(tour.price || 0)}</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                        {[
                          ...(Array.isArray(tour.images) ? tour.images : []),
                          ...(tour.thumbnail ? [tour.thumbnail] : []),
                          ...(tour.cardImage ? [tour.cardImage] : []),
                        ].filter(Boolean).length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tour.groupDiscountEnabled ? (
                          <div className="text-xs text-green-700">
                            <div className="font-semibold">Enabled</div>
                            <div>4: {tour.groupDiscount4 || 0}% {"->"} CHF {(getPriceAfterPercent(groupBasePrice, tour.groupDiscount4) ?? groupBasePrice).toFixed(2)}</div>
                            <div>5: {tour.groupDiscount5 || 0}% {"->"} CHF {(getPriceAfterPercent(groupBasePrice, tour.groupDiscount5) ?? groupBasePrice).toFixed(2)}</div>
                            <div>6+: {tour.groupDiscount6Plus || 0}% {"->"} CHF {(getPriceAfterPercent(groupBasePrice, tour.groupDiscount6Plus) ?? groupBasePrice).toFixed(2)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Off</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={tour.isActive === false ? 'inactive' : 'active'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleStatusToggle(tour)}
                          className="text-gray-700 hover:text-gray-950 mr-4"
                        >
                          {tour.isActive === false ? 'Activate' : 'Deactivate'}
                        </button>
                        <button
                          onClick={() => handleEditClick(tour)}
                          className="text-orange-600 hover:text-orange-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
            
            {filteredTours.length === 0 && (
              <EmptyState title="No tours found" message="Try changing your search or filters." />
            )}
          </AdminCard>
        )}
    </AdminPage>
  );
};

export default AdminUpdateTours;
