import React, { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip } from '../hooks/useTrips';
import type { Trip } from '../types/trip';
import type { TripFormData } from '../schemas/tripSchema';
import { TripTable } from '../components/TripTable';
import { TripCard } from '../components/TripCard';
import { TripFormModal } from '../components/TripFormModal';
import { DeleteDialog } from '../components/DeleteDialog';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Route,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface TripListPageProps {
  onCalculateRoute?: (trip: Trip) => void;
}

export const TripListPage: React.FC<TripListPageProps> = ({ onCalculateRoute }) => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Delete dialog states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  // TanStack Query Hooks
  const { data, isLoading, isError, error } = useTrips({
    search: searchTerm || undefined,
    status: selectedStatus || undefined,
    page: currentPage,
  });

  const createMutation = useCreateTrip();
  const updateMutation = useUpdateTrip();
  const deleteMutation = useDeleteTrip();

  // Normalize results (Paginated vs Raw array)
  const trips: Trip[] = Array.isArray(data)
    ? data
    : (data as any)?.results || [];

  const totalCount = Array.isArray(data) ? data.length : (data as any)?.count || 0;
  const hasNext = Boolean(!Array.isArray(data) && (data as any)?.next);
  const hasPrevious = Boolean(!Array.isArray(data) && (data as any)?.previous);

  const handleOpenCreate = () => {
    setEditingTrip(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: TripFormData) => {
    if (editingTrip) {
      await updateMutation.mutateAsync({
        id: editingTrip.id,
        payload: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleOpenDelete = (id: string) => {
    setDeletingTripId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingTripId) {
      await deleteMutation.mutateAsync(deletingTripId);
      setIsDeleteOpen(false);
      setDeletingTripId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Route className="w-5 h-5" />
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Trip Management</h1>
          </div>
          <p className="text-xs text-neutral-400">
            Create, view, update, and manage trip records stored in PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={!isAuthenticated}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-neutral-0 font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Trip Record
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/90 border border-neutral-200 rounded-2xl p-4 shadow-lg">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search locations or notes..."
            className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-neutral-0 border border-neutral-200 focus:border-brand-500 text-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Planning">Planning</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center bg-neutral-0 border border-neutral-200 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-brand-600 text-neutral-0' : 'text-neutral-400 hover:text-neutral-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-brand-600 text-neutral-0' : 'text-neutral-400 hover:text-neutral-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!isAuthenticated ? (
        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900">Sign In Required</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Please sign in to view, create, edit, and delete your saved trip records.
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 bg-neutral-50/60 border border-neutral-200 rounded-2xl p-5 animate-pulse space-y-4"
            >
              <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-6 bg-neutral-200 rounded w-2/3"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-error-50 border border-error-200 rounded-2xl p-6 text-center text-error-600 space-y-2">
          <AlertCircle className="w-8 h-8 text-error-600 mx-auto" />
          <p className="font-bold text-sm">Failed to load trip records</p>
          <p className="text-xs text-error-500">{(error as any)?.message || 'Please check API connection.'}</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 flex items-center justify-center mx-auto">
            <Route className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">No Trips Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {searchTerm || selectedStatus
                ? 'No trips matched your active search or filter criteria.'
                : 'You have not created any trip records yet. Click below to add your first trip.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-brand-600 hover:bg-brand-700 text-neutral-0 font-semibold px-4 py-2 rounded-xl text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First Trip
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onCalculateRoute={onCalculateRoute}
            />
          ))}
        </div>
      ) : (
        <TripTable
          trips={trips}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onCalculateRoute={onCalculateRoute}
        />
      )}

      {/* Pagination Controls */}
      {totalCount > 20 && (
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          <span>Showing {trips.length} of {totalCount} trips</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={!hasPrevious}
              className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-neutral-800 px-2">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!hasNext}
              className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <TripFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTrip}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
