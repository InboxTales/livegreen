import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, X, Loader2, Video, Search } from 'lucide-react';
import Cookies from 'js-cookie';

interface VideoTestimonial {
    id: number;
    name: string;
    location: string;
    title: string;
    duration: string;
    thumbnail_url?: string;
    thumbnail?: string;
    video_url: string;
    created_at?: string;
}

export default function VideoTestimonialsTab() {
    const [videos, setVideos] = useState<VideoTestimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<VideoTestimonial | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        title: '',
        duration: '',
        thumbnail_url: '',
    });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const response = await fetch('/api/video_testimonials');
            const data = await response.json();
            if (Array.isArray(data)) {
                setVideos(data);
            }
        } catch (error) {
            console.error('Error fetching video testimonials:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (video?: VideoTestimonial) => {
        if (video) {
            setEditingVideo(video);
            setFormData({
                name: video.name,
                location: video.location,
                title: video.title,
                duration: video.duration,
                thumbnail_url: video.thumbnail_url || video.thumbnail || '',
            });
            // We can't set the file input, but we know there's an existing video
        } else {
            setEditingVideo(null);
            setFormData({ name: '', location: '', title: '', duration: '', thumbnail_url: '' });
            setVideoFile(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVideo(null);
        setFormData({ name: '', location: '', title: '', duration: '', thumbnail_url: '' });
        setVideoFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const data = new FormData();
            if (editingVideo) {
                data.append('id', editingVideo.id.toString());
            }
            data.append('name', formData.name);
            data.append('location', formData.location);
            data.append('title', formData.title);
            data.append('duration', formData.duration);
            data.append('thumbnail', formData.thumbnail_url); // We send as thumbnail, API maps to thumbnail in POST but schema is thumbnail_url? Wait, schema has thumbnail_url!
            data.append('thumbnail_url', formData.thumbnail_url);

            if (videoFile) {
                data.append('video', videoFile);
            } else if (!editingVideo) {
                // Creating new without a video file
                alert("Please select a video file to upload.");
                setIsSaving(false);
                return;
            }

            const token = Cookies.get('admin_token');

            const response = await fetch('/api/video_testimonials', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data 
            });

            const result = await response.json();

            if (result.success || result.id) {
                fetchVideos();
                handleCloseModal();
            } else {
                alert('Failed to save video testimonial.');
            }
        } catch (error) {
            console.error('Error saving video:', error);
            alert('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this video testimonial? This will also delete the video file from the server.')) return;

        try {
            const token = Cookies.get('admin_token');
            const response = await fetch(`/api/video_testimonials?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setVideos(videos.filter(v => v.id !== id));
            } else {
                alert('Failed to delete video testimonial.');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    const filteredVideos = videos.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-forest flex items-center gap-2">
                    <Video className="h-6 w-6 text-honey" />
                    Video Testimonials
                </h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-forest text-cream px-4 py-2 rounded-lg hover:bg-forest/90 transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Video
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by customer or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey/50"
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-honey" />
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    No video testimonials found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                        <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
                            <div className="aspect-video bg-gray-100 relative">
                                {video.thumbnail_url || video.thumbnail ? (
                                    <img loading="lazy" decoding="async" src={video.thumbnail_url || video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <Video className="h-12 w-12 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
                                        <Video className="h-5 w-5" />
                                    </a>
                                    <button type="button" onClick={() => handleOpenModal(video)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"><Pencil className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(video.id)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors">
                                        <Trash className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                                    {video.duration || '0:00'}
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{video.title}</h3>
                                <p className="text-sm text-gray-500 mb-4">{video.name} • {video.location}</p>
                                <div className="mt-auto text-xs text-gray-400 truncate">
                                    Path: {video.video_url}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-forest">
                                {editingVideo ? 'Edit Video Testimonial' : 'Add Video Testimonial'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey/50 focus:border-honey/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey/50 focus:border-honey/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quote / Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey/50 focus:border-honey/50"
                                    placeholder='e.g., "My Morning Ritual Changed"'
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey/50 focus:border-honey/50"
                                        placeholder="e.g., 1:24"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                                    <input
                                        type="text"
                                        value={formData.thumbnail_url}
                                        onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey/50 focus:border-honey/50"
                                        placeholder="/images/step_3.png"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                                {!editingVideo ? (
                                    <input
                                        type="file"
                                        accept="video/*"
                                        required={!editingVideo}
                                        onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setVideoFile(e.target.files[0]);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey/50 focus:border-honey/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-honey/10 file:text-honey hover:file:bg-honey/20"
                                    />
                                ) : (
                                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                                        Video file cannot be changed here. To change the video, delete this entry and create a new one.
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-honey text-forest px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    {editingVideo ? 'Save Changes' : 'Upload Video'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
