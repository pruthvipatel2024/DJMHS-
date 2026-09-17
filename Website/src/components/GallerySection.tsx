import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { Translations } from '../translations';

interface GallerySectionProps {
  t: Translations;
}

interface GalleryItem {
  id: number;
  src: string;
  category: 'CAMPUS' | 'ACADEMICS' | 'SPORTS' | 'CULTURAL';
  title: string;
  subtitle: string;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ t }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      src: '/images/school_photo_1.jpg',
      category: 'CAMPUS',
      title: 'School Main Building Facade',
      subtitle: 'Modern architectural wings surrounded by lush green foliage',
    },
    {
      id: 2,
      src: '/images/school_photo_2.jpg',
      category: 'ACADEMICS',
      title: 'Students in Classroom Uniform',
      subtitle: 'Attentive secondary students during morning assembly',
    },
    {
      id: 3,
      src: '/images/school_photo_3.jpg',
      category: 'CULTURAL',
      title: 'Traditional Folk Dance & Garba Celebration',
      subtitle: 'Vibrant cultural heritage and traditional attire',
    },
    {
      id: 4,
      src: '/images/school_photo_4.jpg',
      category: 'SPORTS',
      title: 'Athletics & High Jump Championship',
      subtitle: 'Dynamic outdoor sports and field tournament',
    },
    {
      id: 5,
      src: '/images/school_photo_5.jpg',
      category: 'ACADEMICS',
      title: 'Science & Chemistry Laboratory',
      subtitle: 'State-of-the-art experiment stations for practical science',
    },
    {
      id: 6,
      src: '/images/school_photo_6.jpg',
      category: 'ACADEMICS',
      title: 'Library Reading & Collaborative Study',
      subtitle: 'Students researching curriculum materials',
    },
    {
      id: 7,
      src: '/images/school_photo_7.jpg',
      category: 'CAMPUS',
      title: 'Campus Walkway & Garden',
      subtitle: 'Peaceful learning environment and manicured gardens',
    },
    {
      id: 8,
      src: '/images/school_photo_8.jpg',
      category: 'CULTURAL',
      title: 'Annual Day Drama & Celebrations',
      subtitle: 'Student performances on the auditorium stage',
    },
    {
      id: 9,
      src: '/images/school_photo_9.jpg',
      category: 'SPORTS',
      title: 'Volleyball & Cricket Practice',
      subtitle: 'Physical education and athletic coaching session',
    },
  ];

  const filteredItems =
    activeFilter === 'ALL'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-200">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
              {t.gallery.tag}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
              {t.gallery.title}
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-200/70 p-1.5 rounded-xl text-xs font-bold">
            {t.gallery.filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#0B192C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Responsive Masonry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-md bg-slate-900 cursor-pointer border border-slate-200/80"
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                <div className="flex justify-end">
                  <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                    <ZoomIn className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4C3A3] font-bold">
                    {item.category}
                  </span>
                  <h4 className="font-display text-xl text-white font-normal">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-h-[75vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>

            <div className="p-6 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4C3A3] font-bold">
                  {selectedImage.category}
                </span>
                <h3 className="font-display text-2xl font-normal mt-0.5">
                  {selectedImage.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedImage.subtitle}
                </p>
              </div>

              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                DJMHS PHOTO ARCHIVE
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
