import React, { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import TourEditWizard from "../components/TourEditWizard";
import { getTourId } from "../utils/tourId";

const AdminUpdateTours = () => {
  const { isAdmin, passcodeHeader } = useAdmin();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTour, setEditingTour] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchTours();
    }
  }, [isAdmin]);

  const fetchTours = async () => {
    try {
      const response = await fetch('/api/tours?full=true', {
        headers: {
          'X-Admin-Passcode': passcodeHeader || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTours(data);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tour) => {
    setEditingTour(tour);
  };

  const handleSaveTour = async (savedTour) => {
    try {
      // savedTour is already the response from the API (saved in database)
      // No need to make another API call - just update local state
      console.log('Handling saved tour:', savedTour);
      
      // Update the tours list with the saved tour from database
      const updatedTours = tours.map(tour => {
        const tourId = getTourId(tour);
        const savedTourId = getTourId(savedTour);
        return (tourId === savedTourId || tourId?.toString() === savedTourId?.toString()) ? savedTour : tour;
      });
      
      setTours(updatedTours);
      setEditingTour(null); // Close the wizard
      
      // Refresh the list from server to ensure data consistency
      setTimeout(() => {
        fetchTours();
      }, 500); // Small delay to ensure UI updates first
      
      // Show success message
      alert('Tour updated successfully!');
    } catch (error) {
      console.error('Error handling saved tour:', error);
      alert('Error updating tour list: ' + error.message);
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
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Passcode': passcodeHeader || ''
        }
      });
      
      if (response.ok) {
        // Remove from local state
        setTours(tours.filter(t => getTourId(t)?.toString() !== tourId?.toString()));
        alert('Tour deleted successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to delete tour: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
      alert('Error deleting tour: ' + error.message);
    }
  };

  const filteredTours = tours.filter(tour =>
    tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tour.destination && tour.destination.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Update Tours</h1>
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-600">Loading tours...</p>
          </div>
        ) : editingTour ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Editing: {editingTour.name}</h2>
            <TourEditWizard 
              initialTourData={editingTour}
              tour={editingTour} 
              isOpen={!!editingTour}
              onSave={handleSaveTour} 
              onClose={handleCancelEdit}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTours.map((tour) => (
                    <tr key={getTourId(tour)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {tour.divisionName?.name || tour.destination || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">CHF {tour.price || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${tour.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {tour.featured ? 'Featured' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredTours.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No tours found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpdateTours;