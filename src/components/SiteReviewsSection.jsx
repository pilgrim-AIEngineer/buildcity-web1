import React from "react";

const DEMO_REVIEWS = [
  {
    id: "rev-1",
    name: "Rajesh Verma",
    role: "Civil Contractor, Shivpur",
    initials: "RV",
    rating: 5,
    materialTag: "50 Bags UltraTech Cement",
    materialIcon: "🧱",
    quote:
      "Subah 8 baje order place kiya tha, 11:30 baje site par gaadi khadi thi. Market se rate bhi sasta mila aur material 100% genuine tha.",
    speedBadge: "Delivered in 3.5 Hours",
    verified: true,
    bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
  },
  {
    id: "rev-2",
    name: "Er. Amit Singh",
    role: "Site Engineer, DLW Road",
    initials: "AS",
    rating: 5,
    materialTag: "2.5 Tons Tata Tiscon 550D",
    materialIcon: "🏗️",
    quote:
      "Foundation casting ke liye emergency steel chahiye tha. Test certificate ke saath exact weight par site delivery mili. Full transparency!",
    speedBadge: "Delivered in 6 Hours",
    verified: true,
    bgGradient: "from-blue-500/10 via-sky-500/5 to-transparent",
  },
  {
    id: "rev-3",
    name: "Manoj Yadav",
    role: "Developer, Sigra Colony",
    initials: "MY",
    rating: 5,
    materialTag: "120 Bags Birla A1 Cement",
    materialIcon: "🧱",
    quote:
      "Direct site par unloading ke saath hassle-free delivery. Cash on Delivery (COD) milne se builder community ka trust 100% rehta hai.",
    speedBadge: "Same-Day Dispatch",
    verified: true,
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  {
    id: "rev-4",
    name: "Suresh Gupta",
    role: "Interior Contractor, Lanka",
    initials: "SG",
    rating: 5,
    materialTag: "Asian Paints Apex Ultima & Putty",
    materialIcon: "🎨",
    quote:
      "Original sealed buckets aur proper GST invoice mila. Market ghoomne ka time bach gaya, ab saara maal BuildCity se hi mangwate hain.",
    speedBadge: "Delivered in 9.5 Hours",
    verified: true,
    bgGradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
  },
];

export default function SiteReviewsSection() {
  return (
    <div className="space-y-3 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
  
        <div className="flex items-center  gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>100+ Sites Supplied</span>
        </div>
      </div>

      {/* Horizontal Scrollable Review Cards */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1 px-0.5">
        {DEMO_REVIEWS.map((rev) => (
          <div
            key={rev.id}
            className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between relative group"
          >
            {/* Top Row: User Avatar, Name, Role & Verified Badge */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-900 to-slate-800 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-slate-100">
                    {rev.initials}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-navy-950 leading-tight">
                      {rev.name}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      {rev.role}
                    </p>
                  </div>
                </div>

               
              </div>

              {/* 5 Shiny Stars */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(rev.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-xs"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-[10px] font-bold text-slate-400 ml-1">5.0</span>
              </div>

              {/* Material Chip */}
              <div className="mb-2.5">
                <span className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-navy-900 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-200/60 transition-colors">
                  <span>{rev.materialIcon}</span>
                  <span className="truncate max-w-[210px]">{rev.materialTag}</span>
                </span>
              </div>

              {/* Real Feedback Quote */}
              <p className="text-xs text-slate-700 leading-relaxed font-normal italic">
                "{rev.quote}"
              </p>
            </div>

            {/* Bottom: Delivery Speed Pill */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-full">
                <span>⚡</span>
                <span>{rev.speedBadge}</span>
              </span>

           
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
